// vite.config.js
import { defineConfig } from "file:///C:/Users/User/Desktop/Assignments%20and%20Projects/FYP-ILM-ORA/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/User/Desktop/Assignments%20and%20Projects/FYP-ILM-ORA/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///C:/Users/User/Desktop/Assignments%20and%20Projects/FYP-ILM-ORA/frontend/node_modules/@tailwindcss/vite/dist/index.mjs";
import path from "path";
import { fileURLToPath } from "url";
var __vite_injected_original_import_meta_url = "file:///C:/Users/User/Desktop/Assignments%20and%20Projects/FYP-ILM-ORA/frontend/vite.config.js";
var __dirname = path.dirname(fileURLToPath(__vite_injected_original_import_meta_url));
function stripVersionPlugin() {
  return {
    name: "strip-version-imports",
    enforce: "pre",
    async resolveId(source, importer) {
      if (!source || typeof source !== "string") return null;
      let normalized = source.replace(/^(@radix-ui\/react-[a-z0-9-]+)@[0-9.]+$/, "$1").replace(/^lucide-react@[0-9.]+$/, "lucide-react").replace(/^class-variance-authority@[0-9.]+$/, "class-variance-authority").replace(/^motion\/react$/, "framer-motion").replace(/^motion@[0-9.]+$/, "motion").replace(/^recharts@[0-9.]+$/, "recharts");
      if (normalized !== source) {
        const resolved = await this.resolve(normalized, importer, {
          skipSelf: true
        });
        return resolved ? resolved.id : normalized;
      }
      return null;
    }
  };
}
var vite_config_default = defineConfig({
  plugins: [stripVersionPlugin(), react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: "@",
        replacement: path.resolve(__dirname, "./src")
      },
      {
        find: "@app",
        replacement: path.resolve(__dirname, "./src/app")
      },
      {
        find: "@presentation",
        replacement: path.resolve(__dirname, "./src/presentation")
      },
      {
        find: "@application",
        replacement: path.resolve(__dirname, "./src/application")
      },
      {
        find: "@domain",
        replacement: path.resolve(__dirname, "./src/domain")
      },
      {
        find: "@infrastructure",
        replacement: path.resolve(__dirname, "./src/infrastructure")
      },
      // Normalize imports that mistakenly include an inline version suffix like
      // "@radix-ui/react-tabs@1.1.3" -> "@radix-ui/react-tabs"
      {
        find: /^@radix-ui\/react-([a-z0-9-]+)@[0-9.]+/,
        replacement: "@radix-ui/react-$1"
      },
      // lucide-react@0.487.0 -> lucide-react
      {
        find: /^lucide-react@[0-9.]+/,
        replacement: "lucide-react"
      },
      // class-variance-authority@0.7.1 -> class-variance-authority
      {
        find: /^class-variance-authority@[0-9.]+/,
        replacement: "class-variance-authority"
      },
      // motion@... -> motion (covers some mistaken specifiers)
      {
        find: /^motion@[0-9.]+/,
        replacement: "motion"
      },
      // recharts@... -> recharts
      {
        find: /^recharts@[0-9.]+/,
        replacement: "recharts"
      }
    ]
  },
  server: {
    port: 3001,
    open: true,
    proxy: {
      "/api/recommend": {
        target: "http://localhost:3003",
        changeOrigin: true,
        secure: false
      },
      // Route all API requests through the gateway
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxVc2VyXFxcXERlc2t0b3BcXFxcQXNzaWdubWVudHMgYW5kIFByb2plY3RzXFxcXEZZUC1JTE0tT1JBXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxVc2VyXFxcXERlc2t0b3BcXFxcQXNzaWdubWVudHMgYW5kIFByb2plY3RzXFxcXEZZUC1JTE0tT1JBXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9Vc2VyL0Rlc2t0b3AvQXNzaWdubWVudHMlMjBhbmQlMjBQcm9qZWN0cy9GWVAtSUxNLU9SQS9mcm9udGVuZC92aXRlLmNvbmZpZy5qc1wiOy8vIGZyb250ZW5kL3ZpdGUuY29uZmlnLmpzXHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xyXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ3VybCc7XHJcbmNvbnN0IF9fZGlybmFtZSA9IHBhdGguZGlybmFtZShmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCkpO1xyXG5mdW5jdGlvbiBzdHJpcFZlcnNpb25QbHVnaW4oKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIG5hbWU6ICdzdHJpcC12ZXJzaW9uLWltcG9ydHMnLFxyXG4gICAgZW5mb3JjZTogJ3ByZScsXHJcbiAgICBhc3luYyByZXNvbHZlSWQoc291cmNlLCBpbXBvcnRlcikge1xyXG4gICAgICBpZiAoIXNvdXJjZSB8fCB0eXBlb2Ygc291cmNlICE9PSAnc3RyaW5nJykgcmV0dXJuIG51bGw7XHJcbiAgICAgIC8vIE5vcm1hbGl6ZSBzcGVjaWZpYyBjb21tb24gYmFkIHNwZWNpZmllcnMgdG8gdGhlaXIgY2Fub25pY2FsIHBhY2thZ2UgbmFtZXNcclxuICAgICAgbGV0IG5vcm1hbGl6ZWQgPSBzb3VyY2UucmVwbGFjZSgvXihAcmFkaXgtdWlcXC9yZWFjdC1bYS16MC05LV0rKUBbMC05Ll0rJC8sICckMScpLnJlcGxhY2UoL15sdWNpZGUtcmVhY3RAWzAtOS5dKyQvLCAnbHVjaWRlLXJlYWN0JykucmVwbGFjZSgvXmNsYXNzLXZhcmlhbmNlLWF1dGhvcml0eUBbMC05Ll0rJC8sICdjbGFzcy12YXJpYW5jZS1hdXRob3JpdHknKS5yZXBsYWNlKC9ebW90aW9uXFwvcmVhY3QkLywgJ2ZyYW1lci1tb3Rpb24nKS5yZXBsYWNlKC9ebW90aW9uQFswLTkuXSskLywgJ21vdGlvbicpLnJlcGxhY2UoL15yZWNoYXJ0c0BbMC05Ll0rJC8sICdyZWNoYXJ0cycpO1xyXG4gICAgICBpZiAobm9ybWFsaXplZCAhPT0gc291cmNlKSB7XHJcbiAgICAgICAgLy8gTGV0IFZpdGUgcmVzb2x2ZSB0aGUgbm9ybWFsaXplZCBpZDsgaWYgaXQgcmVzb2x2ZXMsIHJldHVybiBpdCBzbyBidW5kbGVyIHVzZXMgaXRcclxuICAgICAgICBjb25zdCByZXNvbHZlZCA9IGF3YWl0IHRoaXMucmVzb2x2ZShub3JtYWxpemVkLCBpbXBvcnRlciwge1xyXG4gICAgICAgICAgc2tpcFNlbGY6IHRydWVcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gcmVzb2x2ZWQgPyByZXNvbHZlZC5pZCA6IG5vcm1hbGl6ZWQ7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgfTtcclxufVxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtzdHJpcFZlcnNpb25QbHVnaW4oKSwgcmVhY3QoKSwgdGFpbHdpbmRjc3MoKV0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IFt7XHJcbiAgICAgIGZpbmQ6ICdAJyxcclxuICAgICAgcmVwbGFjZW1lbnQ6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpXHJcbiAgICB9LCB7XHJcbiAgICAgIGZpbmQ6ICdAYXBwJyxcclxuICAgICAgcmVwbGFjZW1lbnQ6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy9hcHAnKVxyXG4gICAgfSwge1xyXG4gICAgICBmaW5kOiAnQHByZXNlbnRhdGlvbicsXHJcbiAgICAgIHJlcGxhY2VtZW50OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvcHJlc2VudGF0aW9uJylcclxuICAgIH0sIHtcclxuICAgICAgZmluZDogJ0BhcHBsaWNhdGlvbicsXHJcbiAgICAgIHJlcGxhY2VtZW50OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvYXBwbGljYXRpb24nKVxyXG4gICAgfSwge1xyXG4gICAgICBmaW5kOiAnQGRvbWFpbicsXHJcbiAgICAgIHJlcGxhY2VtZW50OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvZG9tYWluJylcclxuICAgIH0sIHtcclxuICAgICAgZmluZDogJ0BpbmZyYXN0cnVjdHVyZScsXHJcbiAgICAgIHJlcGxhY2VtZW50OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvaW5mcmFzdHJ1Y3R1cmUnKVxyXG4gICAgfSxcclxuICAgIC8vIE5vcm1hbGl6ZSBpbXBvcnRzIHRoYXQgbWlzdGFrZW5seSBpbmNsdWRlIGFuIGlubGluZSB2ZXJzaW9uIHN1ZmZpeCBsaWtlXHJcbiAgICAvLyBcIkByYWRpeC11aS9yZWFjdC10YWJzQDEuMS4zXCIgLT4gXCJAcmFkaXgtdWkvcmVhY3QtdGFic1wiXHJcbiAgICB7XHJcbiAgICAgIGZpbmQ6IC9eQHJhZGl4LXVpXFwvcmVhY3QtKFthLXowLTktXSspQFswLTkuXSsvLFxyXG4gICAgICByZXBsYWNlbWVudDogJ0ByYWRpeC11aS9yZWFjdC0kMSdcclxuICAgIH0sXHJcbiAgICAvLyBsdWNpZGUtcmVhY3RAMC40ODcuMCAtPiBsdWNpZGUtcmVhY3RcclxuICAgIHtcclxuICAgICAgZmluZDogL15sdWNpZGUtcmVhY3RAWzAtOS5dKy8sXHJcbiAgICAgIHJlcGxhY2VtZW50OiAnbHVjaWRlLXJlYWN0J1xyXG4gICAgfSxcclxuICAgIC8vIGNsYXNzLXZhcmlhbmNlLWF1dGhvcml0eUAwLjcuMSAtPiBjbGFzcy12YXJpYW5jZS1hdXRob3JpdHlcclxuICAgIHtcclxuICAgICAgZmluZDogL15jbGFzcy12YXJpYW5jZS1hdXRob3JpdHlAWzAtOS5dKy8sXHJcbiAgICAgIHJlcGxhY2VtZW50OiAnY2xhc3MtdmFyaWFuY2UtYXV0aG9yaXR5J1xyXG4gICAgfSxcclxuICAgIC8vIG1vdGlvbkAuLi4gLT4gbW90aW9uIChjb3ZlcnMgc29tZSBtaXN0YWtlbiBzcGVjaWZpZXJzKVxyXG4gICAge1xyXG4gICAgICBmaW5kOiAvXm1vdGlvbkBbMC05Ll0rLyxcclxuICAgICAgcmVwbGFjZW1lbnQ6ICdtb3Rpb24nXHJcbiAgICB9LFxyXG4gICAgLy8gcmVjaGFydHNALi4uIC0+IHJlY2hhcnRzXHJcbiAgICB7XHJcbiAgICAgIGZpbmQ6IC9ecmVjaGFydHNAWzAtOS5dKy8sXHJcbiAgICAgIHJlcGxhY2VtZW50OiAncmVjaGFydHMnXHJcbiAgICB9XVxyXG4gIH0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBwb3J0OiAzMDAxLFxyXG4gICAgb3BlbjogdHJ1ZSxcclxuICAgIHByb3h5OiB7XHJcbiAgICAgICcvYXBpL3JlY29tbWVuZCc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDMnLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICBzZWN1cmU6IGZhbHNlXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIFJvdXRlIGFsbCBBUEkgcmVxdWVzdHMgdGhyb3VnaCB0aGUgZ2F0ZXdheVxyXG4gICAgICAnL2FwaSc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDAnLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICBzZWN1cmU6IGZhbHNlXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFdBQVc7QUFDbEIsT0FBTyxpQkFBaUI7QUFDeEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMscUJBQXFCO0FBTDZOLElBQU0sMkNBQTJDO0FBTTVTLElBQU0sWUFBWSxLQUFLLFFBQVEsY0FBYyx3Q0FBZSxDQUFDO0FBQzdELFNBQVMscUJBQXFCO0FBQzVCLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLFNBQVM7QUFBQSxJQUNULE1BQU0sVUFBVSxRQUFRLFVBQVU7QUFDaEMsVUFBSSxDQUFDLFVBQVUsT0FBTyxXQUFXLFNBQVUsUUFBTztBQUVsRCxVQUFJLGFBQWEsT0FBTyxRQUFRLDJDQUEyQyxJQUFJLEVBQUUsUUFBUSwwQkFBMEIsY0FBYyxFQUFFLFFBQVEsc0NBQXNDLDBCQUEwQixFQUFFLFFBQVEsbUJBQW1CLGVBQWUsRUFBRSxRQUFRLG9CQUFvQixRQUFRLEVBQUUsUUFBUSxzQkFBc0IsVUFBVTtBQUN2VSxVQUFJLGVBQWUsUUFBUTtBQUV6QixjQUFNLFdBQVcsTUFBTSxLQUFLLFFBQVEsWUFBWSxVQUFVO0FBQUEsVUFDeEQsVUFBVTtBQUFBLFFBQ1osQ0FBQztBQUNELGVBQU8sV0FBVyxTQUFTLEtBQUs7QUFBQSxNQUNsQztBQUNBLGFBQU87QUFBQSxJQUNUO0FBQUEsRUFDRjtBQUNGO0FBQ0EsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLG1CQUFtQixHQUFHLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFBQSxFQUN0RCxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFBQztBQUFBLFFBQ04sTUFBTTtBQUFBLFFBQ04sYUFBYSxLQUFLLFFBQVEsV0FBVyxPQUFPO0FBQUEsTUFDOUM7QUFBQSxNQUFHO0FBQUEsUUFDRCxNQUFNO0FBQUEsUUFDTixhQUFhLEtBQUssUUFBUSxXQUFXLFdBQVc7QUFBQSxNQUNsRDtBQUFBLE1BQUc7QUFBQSxRQUNELE1BQU07QUFBQSxRQUNOLGFBQWEsS0FBSyxRQUFRLFdBQVcsb0JBQW9CO0FBQUEsTUFDM0Q7QUFBQSxNQUFHO0FBQUEsUUFDRCxNQUFNO0FBQUEsUUFDTixhQUFhLEtBQUssUUFBUSxXQUFXLG1CQUFtQjtBQUFBLE1BQzFEO0FBQUEsTUFBRztBQUFBLFFBQ0QsTUFBTTtBQUFBLFFBQ04sYUFBYSxLQUFLLFFBQVEsV0FBVyxjQUFjO0FBQUEsTUFDckQ7QUFBQSxNQUFHO0FBQUEsUUFDRCxNQUFNO0FBQUEsUUFDTixhQUFhLEtBQUssUUFBUSxXQUFXLHNCQUFzQjtBQUFBLE1BQzdEO0FBQUE7QUFBQTtBQUFBLE1BR0E7QUFBQSxRQUNFLE1BQU07QUFBQSxRQUNOLGFBQWE7QUFBQSxNQUNmO0FBQUE7QUFBQSxNQUVBO0FBQUEsUUFDRSxNQUFNO0FBQUEsUUFDTixhQUFhO0FBQUEsTUFDZjtBQUFBO0FBQUEsTUFFQTtBQUFBLFFBQ0UsTUFBTTtBQUFBLFFBQ04sYUFBYTtBQUFBLE1BQ2Y7QUFBQTtBQUFBLE1BRUE7QUFBQSxRQUNFLE1BQU07QUFBQSxRQUNOLGFBQWE7QUFBQSxNQUNmO0FBQUE7QUFBQSxNQUVBO0FBQUEsUUFDRSxNQUFNO0FBQUEsUUFDTixhQUFhO0FBQUEsTUFDZjtBQUFBLElBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxrQkFBa0I7QUFBQSxRQUNoQixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsTUFDVjtBQUFBO0FBQUEsTUFFQSxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsTUFDVjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
