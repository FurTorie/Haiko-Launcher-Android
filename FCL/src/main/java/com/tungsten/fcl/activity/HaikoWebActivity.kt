package com.tungsten.fcl.activity

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import com.tungsten.fcl.R
import com.tungsten.fcl.bridge.HaikoJavaScriptInterface

class HaikoWebActivity : AppCompatActivity() {
    
    private lateinit var webView: WebView
    private lateinit var jsInterface: HaikoJavaScriptInterface
    
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_haiko_web)
        
        webView = findViewById(R.id.haiko_webview)
        jsInterface = HaikoJavaScriptInterface(this)
        
        setupWebView()
        loadHaikoInterface()
    }
    
    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            allowFileAccessFromFileURLs = true
            allowUniversalAccessFromFileURLs = true
            databaseEnabled = true
            cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
        }
        
        // Ajouter l'interface JavaScript
        webView.addJavascriptInterface(jsInterface, "AndroidBridge")
        
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                return false
            }
            
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Injecter le bridge JavaScript
                injectBridgeScript()
            }
        }
        
        webView.webChromeClient = WebChromeClient()
    }
    
    private fun loadHaikoInterface() {
        // Charger l'interface Haiko depuis les assets
        webView.loadUrl("file:///android_asset/haiko/launcher.html")
    }
    
    private fun injectBridgeScript() {
        // Script pour remplacer les fonctionnalités Electron par Android
        val bridgeScript = """
            // Remplacer les modules Electron par des bridges Android
            window.require = function(module) {
                switch(module) {
                    case 'electron':
                        return {
                            ipcRenderer: window.AndroidBridge.getIpcRenderer()
                        };
                    case 'fs':
                        return window.AndroidBridge.getFileSystem();
                    case 'minecraft-java-core':
                        return window.AndroidBridge.getMinecraftCore();
                    default:
                        return {};
                }
            };
            
            // Signaler que le bridge est prêt
            window.AndroidBridge.onBridgeReady();
        """.trimIndent()
        
        webView.evaluateJavascript(bridgeScript, null)
    }
    
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
    
    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}