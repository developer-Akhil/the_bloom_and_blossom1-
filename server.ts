import * as dotenv from "dotenv";
dotenv.config({ override: true });
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import compression from "compression";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./server/routes/authRoutes.js";
import paymentRoutes from "./server/routes/paymentRoutes.js";
import contactRoutes from "./server/routes/contactRoutes.js";
import orderRoutes from "./server/routes/orderRoutes.js";
import adminRoutes from "./server/routes/adminRoutes.js";
import reviewRoutes from "./server/routes/reviewRoutes.js";

const __filename = fileURLToPath(import.meta.url);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Trust the first proxy (Hostinger/Nginx/Apache)
  // This resolves the rate limit warnings about X-Forwarded-For
  app.set('trust proxy', 1);

  // Comprehensive request logging
  app.use((req, _res, next) => {
    console.log(`[Incoming Request] ${req.method} ${req.url}`);
    console.log(`[Headers] ${JSON.stringify({
      ip: req.ip,
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'forwarded': req.headers['forwarded']
    })}`);
    next();
  });

/*
  // Security Middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Too restrictive by default for React/Vite
    crossOriginEmbedderPolicy: false,
  }));
*/

  // CORS - very permissive for debugging
  app.use(cors({
    origin: function (origin, callback) {
      console.log(`[CORS Request] Origin: ${origin}`);
      // Allow all origins in development and potentially production for debugging
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Razorpay-Signature']
  }));

  // Compression
  app.use(compression());

  // Request Logging
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

  // Rate Limiting
  /*
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: "Too many requests, please try again later." }
  });

  app.use("/api", apiLimiter);
  */

  // Request logging for debugging routing issues in production
  app.use("/api", (req, _res, next) => {
    console.log(`[API Request] ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json({ 
    limit: '50mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ extended: true }));

  // Root health check as suggested by Hostinger
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", message: "Server is healthy", timestamp: new Date().toISOString() });
  });

  app.get("/ping", (_req, res) => {
    res.send("pong");
  });

  // Dynamic XML Sitemap for Google Search Console & SEO
  app.get("/sitemap.xml", (_req, res) => {
    const baseUrl = "https://bloomandblossom.in";
    const staticRoutes = [
      "",
      "/collections",
      "/about",
      "/contact",
      "/returns",
      "/privacy",
      "/terms",
      "/faq",
      "/new-arrivals",
      "/wishlist"
    ];

    let autoId = 1000;
    const productIds: string[] = [];
    const configPath = path.join(process.cwd(), 'src', 'config', 'config_product.json');
    
    if (fs.existsSync(configPath)) {
      try {
        const configRaw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        const collectionsObj = configRaw.Collections || configRaw;
        const processedLocations = new Set<string>();

        for (const [, macroCategoryObj] of Object.entries(collectionsObj)) {
          if (!macroCategoryObj || typeof macroCategoryObj !== 'object') continue;

          for (const [subKey, subValue] of Object.entries(macroCategoryObj)) {
            if (!subValue || typeof subValue !== 'object') continue;

            if (subKey.startsWith('public/')) {
              productIds.push(`prod_${autoId++}`);
              processedLocations.add(subKey.substring(6));
            } else {
              // Grouped product
              let hasVariants = false;
              for (const [varLocation] of Object.entries(subValue as object)) {
                if (varLocation.startsWith('public/')) {
                  hasVariants = true;
                  processedLocations.add(varLocation.substring(6));
                }
              }
              if (hasVariants) {
                productIds.push(`prod_grp_${autoId++}`);
              }
            }
          }
        }

        // Folder auto-discovery scanner
        const collectionsDir = path.join(process.cwd(), 'public', 'images', 'collections');
        if (fs.existsSync(collectionsDir)) {
          const getFilesRecursively = (dir: string): string[] => {
            let results: string[] = [];
            const list = fs.readdirSync(dir);
            list.forEach(file => {
              const fullPath = path.join(dir, file);
              const stat = fs.statSync(fullPath);
              if (stat && stat.isDirectory()) {
                results = results.concat(getFilesRecursively(fullPath));
              } else {
                if (/\.(jpg|jpeg|png|webp)$/i.test(file) && !file.endsWith('.keep')) {
                  results.push(fullPath);
                }
              }
            });
            return results;
          };

          const diskFiles = getFilesRecursively(collectionsDir);
          diskFiles.forEach(filePath => {
            const relativePath = path.relative(path.join(process.cwd(), 'public'), filePath).replace(/\\/g, '/');
            const cleanUrl = '/' + relativePath;
            if (!processedLocations.has(cleanUrl)) {
              productIds.push(`auto_${autoId++}`);
            }
          });
        }
      } catch (e) {
        console.error('Error parsing config_product.json for sitemap:', e);
      }
    }

    // Build the XML sitemap
    let sitemapXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemapXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // 1. Add static pages
    staticRoutes.forEach(route => {
      sitemapXml += '  <url>\n';
      sitemapXml += `    <loc>${baseUrl}${route}</loc>\n`;
      sitemapXml += '    <changefreq>daily</changefreq>\n';
      sitemapXml += `    <priority>${route === "" ? "1.0" : "0.8"}</priority>\n`;
      sitemapXml += '  </url>\n';
    });

    // 2. Add dynamic products pages
    productIds.forEach(id => {
      sitemapXml += '  <url>\n';
      sitemapXml += `    <loc>${baseUrl}/products/${id}</loc>\n`;
      sitemapXml += '    <changefreq>weekly</changefreq>\n';
      sitemapXml += '    <priority>0.7</priority>\n';
      sitemapXml += '  </url>\n';
    });

    sitemapXml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(sitemapXml);
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    const razorpayKeysSet = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(), 
      env: process.env.NODE_ENV,
      config: {
        razorpay: razorpayKeysSet ? "configured" : "missing",
        port: PORT
      }
    });
  });

  // API router
  app.use("/api/auth", authRoutes);
  app.use("/api/payment", paymentRoutes);
  app.use("/api/contact", contactRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/reviews", reviewRoutes);

  // Temporary route to test ENV variables (diagnostics)
  app.get("/api/env-test", (_req, res) => {
    
    let keyId = process.env.RAZORPAY_KEY_ID || "";
    let keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    
    keyId = keyId.replace(/^["']|["']$/g, '').trim();
    keySecret = keySecret.replace(/^["']|["']$/g, '').trim();

    res.json({
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      hasRazorpayId: !!process.env.RAZORPAY_KEY_ID,
      hasRazorpaySecret: !!process.env.RAZORPAY_KEY_SECRET,
      razorpayIdLength: keyId.length,
      razorpaySecretLength: keySecret.length,
      razorpayIdSegment: keyId ? `${keyId.substring(0, 4)}...${keyId.substring(keyId.length - 2)}` : null,
      keys: Object.keys(process.env).length
    });
  });

  // Fallback for unmatched API routes
  app.all("/api/*", (req, res) => {
    console.warn(`[Unmatched API Route] ${req.method} ${req.url}`);
    res.status(404).json({ 
      error: "API route not found", 
      method: req.method, 
      path: req.url 
    });
  });

  app.post("/api/upload-image", (req, res) => {
    const { folderId, fileName, base64Data } = req.body;
    if (!folderId || !fileName || !base64Data) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // Allow writing to collections or product_images sub-paths dynamically
      let cleanFolderId = folderId.replace(/\s+/g, '_');
      // e.g. "collections/bows"
      let targetDir = path.join(process.cwd(), "public", "images");
      const subParts = cleanFolderId.split('/');
      for (const part of subParts) {
         targetDir = path.join(targetDir, part.replace(/[^a-zA-Z0-9_\-]/g, ""));
      }

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const safeFileName = fileName.replace(/[^a-zA-Z0-9_\-\.]/g, "");
      const targetPath = path.join(targetDir, safeFileName);

      // Extract the actual base64 content
      const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
      fs.writeFileSync(targetPath, Buffer.from(base64Content, 'base64'));

      // Return the public URL for the newly created file
      const publicUrl = `/images/${subParts.join('/')}/${safeFileName}`;

      res.json({ success: true, url: publicUrl });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/create-folder", (req, res) => {
    const { name, parent } = req.body;
    if (!name) return res.status(400).json({ error: "Folder name is required" });

    // Ensure we create strings safely
    const safeName = name.replace(/[^a-zA-Z0-9_\- ]/g, "").replace(/\s+/g, "_");

    // Base directory for collections
    let baseDir = path.join(process.cwd(), "public", "images", "collections");

    let targetPath = path.join(baseDir, safeName);
    
    try {
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
        // Add a .keep file ensures the folder persists
        fs.writeFileSync(path.join(targetPath, ".keep"), "");
      }
      res.json({ success: true, path: targetPath });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  let isDev = process.env.NODE_ENV !== "production";
  
  if (isDev) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (error) {
      console.warn("[Server] Vite not found, falling back to static production serving.");
      isDev = false;
    }
  }

  if (!isDev) {
    const defaultDist = path.join(process.cwd(), 'dist');
    const distPath = fs.existsSync(defaultDist) ? defaultDist : process.cwd();
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).json({ error: "Frontend build not found" });
      }
    });
  }

  app.use('/api', (err: any, _req: any, res: any, _next: any) => {
    console.error('API Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  });

  if (typeof PORT === 'string' && PORT.startsWith('/')) {
    app.listen(PORT, () => {
      console.log(`Server running on socket ${PORT}`);
    });
  } else {
  const portNum = typeof PORT === 'string' ? parseInt(PORT, 10) : PORT;
    
    const server = app.listen(portNum, "0.0.0.0", () => {
      const address = server.address();
      const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + address?.port;
      console.log(`[Server] Production Node.js server started and listening on ${bind}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV}`);
      console.log(`[Server] PID: ${process.pid}`);
    });

    server.on('error', (error: any) => {
      console.error('[Server Error] Failed to start server:', error);
      if (error.syscall !== 'listen') throw error;
      switch (error.code) {
        case 'EACCES':
          console.error(`[Server Error] Port ${portNum} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`[Server Error] Port ${portNum} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  }
}

startServer();
