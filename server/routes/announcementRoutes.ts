import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

const DATA_DIR = path.join(process.cwd(), "data");
const ANNOUNCEMENTS_FILE = path.join(DATA_DIR, "announcements.json");

export type AnnouncementType = 'general' | 'offer' | 'festival' | 'alert';

export interface AnnouncementItem {
  id: string;
  text: string;
  type: AnnouncementType;
  badgeText?: string;
  linkUrl?: string;
  linkText?: string;
  couponCode?: string;
  isActive: boolean;
  displayOrder: number;
  startDate?: string | null;
  endDate?: string | null;
  backgroundColor?: string;
  textColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementSettings {
  enabled: boolean;
  scrollSpeed: 'slow' | 'normal' | 'fast';
  pauseOnHover: boolean;
  announcements: AnnouncementItem[];
  updatedAt: string;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getDefaultAnnouncements(): AnnouncementSettings {
  return {
    enabled: true,
    scrollSpeed: "normal",
    pauseOnHover: true,
    announcements: [
      {
        id: "ann_1",
        text: "Free Shipping on Orders Above Rs 2000",
        type: "offer",
        badgeText: "FREE SHIPPING",
        linkUrl: "/collections",
        linkText: "Shop Now",
        couponCode: "",
        isActive: true,
        displayOrder: 1,
        startDate: null,
        endDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "ann_2",
        text: "Check out our Navratri Special",
        type: "festival",
        badgeText: "NAVRATRI SPECIAL",
        linkUrl: "/collections?festival=true",
        linkText: "Explore Festive Drops",
        couponCode: "",
        isActive: true,
        displayOrder: 2,
        startDate: null,
        endDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    updatedAt: new Date().toISOString()
  };
}

function readData(): AnnouncementSettings {
  ensureDataDir();
  if (fs.existsSync(ANNOUNCEMENTS_FILE)) {
    try {
      const raw = fs.readFileSync(ANNOUNCEMENTS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        enabled: parsed.enabled !== false,
        scrollSpeed: parsed.scrollSpeed || "normal",
        pauseOnHover: parsed.pauseOnHover !== false,
        announcements: Array.isArray(parsed.announcements) ? parsed.announcements : [],
        updatedAt: parsed.updatedAt || new Date().toISOString()
      };
    } catch (err) {
      console.error("[Announcements] Error reading announcements.json:", err);
    }
  }
  const defaults = getDefaultAnnouncements();
  writeData(defaults);
  return defaults;
}

function writeData(data: AnnouncementSettings): void {
  ensureDataDir();
  try {
    data.updatedAt = new Date().toISOString();
    fs.writeFileSync(ANNOUNCEMENTS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[Announcements] Error writing announcements.json:", err);
  }
}

// --------------------------------------------------------------------------
// Public Route: Get Active Announcements for Storefront
// --------------------------------------------------------------------------
router.get("/active", (_req, res) => {
  try {
    const data = readData();

    if (!data.enabled) {
      return res.json({
        enabled: false,
        scrollSpeed: data.scrollSpeed,
        pauseOnHover: data.pauseOnHover,
        announcements: []
      });
    }

    const now = new Date();

    const activeList = data.announcements
      .filter(item => {
        if (!item.isActive) return false;

        // Check startDate if set
        if (item.startDate) {
          const start = new Date(item.startDate);
          if (!isNaN(start.getTime()) && now < start) {
            return false;
          }
        }

        // Check endDate if set
        if (item.endDate) {
          const end = new Date(item.endDate);
          if (!isNaN(end.getTime()) && now > end) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    res.json({
      enabled: true,
      scrollSpeed: data.scrollSpeed,
      pauseOnHover: data.pauseOnHover,
      announcements: activeList
    });
  } catch (err: any) {
    console.error("[Announcements] Error fetching active announcements:", err);
    res.status(500).json({ error: "Failed to fetch active announcements" });
  }
});

// --------------------------------------------------------------------------
// Admin Route: Get All Announcements & Settings
// --------------------------------------------------------------------------
router.get("/", (_req, res) => {
  try {
    const data = readData();
    // Sort announcements by displayOrder
    const sorted = [...data.announcements].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    res.json({
      ...data,
      announcements: sorted
    });
  } catch (err: any) {
    console.error("[Announcements] Error fetching announcements:", err);
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
});

// --------------------------------------------------------------------------
// Admin Route: Create New Announcement
// --------------------------------------------------------------------------
router.post("/", (req, res) => {
  try {
    const { text, type, badgeText, linkUrl, linkText, couponCode, isActive, displayOrder, startDate, endDate, backgroundColor, textColor } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Announcement text is required" });
    }

    const data = readData();
    const newId = `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const maxOrder = data.announcements.reduce((max, item) => Math.max(max, item.displayOrder || 0), 0);
    const assignedOrder = typeof displayOrder === "number" && !isNaN(displayOrder) ? displayOrder : maxOrder + 1;

    const newItem: AnnouncementItem = {
      id: newId,
      text: text.trim(),
      type: type || 'general',
      badgeText: badgeText ? String(badgeText).trim() : undefined,
      linkUrl: linkUrl ? String(linkUrl).trim() : undefined,
      linkText: linkText ? String(linkText).trim() : undefined,
      couponCode: couponCode ? String(couponCode).trim() : undefined,
      isActive: isActive !== false,
      displayOrder: assignedOrder,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
      backgroundColor: backgroundColor || undefined,
      textColor: textColor || undefined,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    data.announcements.push(newItem);
    writeData(data);

    res.status(201).json({ success: true, item: newItem });
  } catch (err: any) {
    console.error("[Announcements] Error creating announcement:", err);
    res.status(500).json({ error: "Failed to create announcement" });
  }
});

// --------------------------------------------------------------------------
// Admin Route: Update Announcement by ID
// --------------------------------------------------------------------------
router.put("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { text, type, badgeText, linkUrl, linkText, couponCode, isActive, displayOrder, startDate, endDate, backgroundColor, textColor } = req.body;

    const data = readData();
    const index = data.announcements.findIndex(item => item.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    const current = data.announcements[index];
    const updated: AnnouncementItem = {
      ...current,
      text: text !== undefined ? String(text).trim() : current.text,
      type: type || current.type,
      badgeText: badgeText !== undefined ? (badgeText ? String(badgeText).trim() : undefined) : current.badgeText,
      linkUrl: linkUrl !== undefined ? (linkUrl ? String(linkUrl).trim() : undefined) : current.linkUrl,
      linkText: linkText !== undefined ? (linkText ? String(linkText).trim() : undefined) : current.linkText,
      couponCode: couponCode !== undefined ? (couponCode ? String(couponCode).trim() : undefined) : current.couponCode,
      isActive: isActive !== undefined ? Boolean(isActive) : current.isActive,
      displayOrder: typeof displayOrder === "number" && !isNaN(displayOrder) ? displayOrder : current.displayOrder,
      startDate: startDate !== undefined ? (startDate ? new Date(startDate).toISOString() : null) : current.startDate,
      endDate: endDate !== undefined ? (endDate ? new Date(endDate).toISOString() : null) : current.endDate,
      backgroundColor: backgroundColor !== undefined ? backgroundColor : current.backgroundColor,
      textColor: textColor !== undefined ? textColor : current.textColor,
      updatedAt: new Date().toISOString()
    };

    data.announcements[index] = updated;
    writeData(data);

    res.json({ success: true, item: updated });
  } catch (err: any) {
    console.error("[Announcements] Error updating announcement:", err);
    res.status(500).json({ error: "Failed to update announcement" });
  }
});

// --------------------------------------------------------------------------
// Admin Route: Toggle Active State
// --------------------------------------------------------------------------
router.put("/toggle/:id", (req, res) => {
  try {
    const { id } = req.params;
    const data = readData();
    const item = data.announcements.find(a => a.id === id);

    if (!item) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    item.isActive = !item.isActive;
    item.updatedAt = new Date().toISOString();
    writeData(data);

    res.json({ success: true, item });
  } catch (err: any) {
    console.error("[Announcements] Error toggling announcement:", err);
    res.status(500).json({ error: "Failed to toggle announcement" });
  }
});

// --------------------------------------------------------------------------
// Admin Route: Delete Announcement by ID
// --------------------------------------------------------------------------
router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const data = readData();
    const initialLen = data.announcements.length;
    data.announcements = data.announcements.filter(item => item.id !== id);

    if (data.announcements.length === initialLen) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    writeData(data);
    res.json({ success: true, message: "Announcement deleted successfully" });
  } catch (err: any) {
    console.error("[Announcements] Error deleting announcement:", err);
    res.status(500).json({ error: "Failed to delete announcement" });
  }
});

// --------------------------------------------------------------------------
// Admin Route: Bulk Reorder Announcements
// --------------------------------------------------------------------------
router.put("/reorder/batch", (req, res) => {
  try {
    const { orderedIds } = req.body; // Array of item IDs in desired order: string[]

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: "orderedIds must be an array of announcement IDs" });
    }

    const data = readData();
    const idMap = new Map<string, number>();
    orderedIds.forEach((id, index) => {
      idMap.set(id, index + 1);
    });

    data.announcements = data.announcements.map(item => {
      if (idMap.has(item.id)) {
        return {
          ...item,
          displayOrder: idMap.get(item.id)!,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });

    data.announcements.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    writeData(data);

    res.json({ success: true, announcements: data.announcements });
  } catch (err: any) {
    console.error("[Announcements] Error reordering announcements:", err);
    res.status(500).json({ error: "Failed to reorder announcements" });
  }
});

// --------------------------------------------------------------------------
// Admin Route: Update Global Settings
// --------------------------------------------------------------------------
router.put("/config/settings", (req, res) => {
  try {
    const { enabled, scrollSpeed, pauseOnHover } = req.body;
    const data = readData();

    if (enabled !== undefined) data.enabled = Boolean(enabled);
    if (scrollSpeed && ['slow', 'normal', 'fast'].includes(scrollSpeed)) {
      data.scrollSpeed = scrollSpeed;
    }
    if (pauseOnHover !== undefined) data.pauseOnHover = Boolean(pauseOnHover);

    writeData(data);
    res.json({ success: true, settings: data });
  } catch (err: any) {
    console.error("[Announcements] Error updating announcement settings:", err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
