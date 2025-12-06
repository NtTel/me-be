Skip to contentmb – Deployment Source – Vercel
asking
asking

Pro

mb

6iV4NqGpG


Find…
F

Source
Output
index.html

      
      #root {
        height: 100%;
        overflow-y: auto; /* Internal scrolling for app-like feel */
        -webkit-overflow-scrolling: touch;
      }

      /* Utilities */
      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      
      /* Disable selection for UI elements */
      .select-none {
        -webkit-user-select: none;
        user-select: none;
      }
      
      /* Safe area padding utilities fallback */
      .pb-safe {
        padding-bottom: env(safe-area-inset-bottom, 20px);
      }
      .pt-safe {
        padding-top: env(safe-area-inset-top, 20px);
      }
    </style>
<script type="importmap">
{
  "imports": {
    "react": "https://aistudiocdn.com/react@^19.2.1",
    "react-dom/": "https://aistudiocdn.com/react-dom@^19.2.1/",
    "react/": "https://aistudiocdn.com/react@^19.2.1/",
    "@google/genai": "https://aistudiocdn.com/@google/genai@^1.31.0",
    "react-router-dom": "https://aistudiocdn.com/react-router-dom@^7.10.1",
    "lucide-react": "https://aistudiocdn.com/lucide-react@^0.556.0",
    "firebase/": "https://aistudiocdn.com/firebase@^12.6.0/",
    "vite": "https://aistudiocdn.com/vite@^7.2.6",
    "@vitejs/plugin-react": "https://aistudiocdn.com/@vitejs/plugin-react@^5.1.1"
  }
}
</script>
</head>
  <body>
    <div id="root"></div>
    <!-- Entry Point for Vite Build -->
    <script type="module" src="./index.tsx"></script>
  </body>
</html>
14:02:00
success:
Deployment created.
1
