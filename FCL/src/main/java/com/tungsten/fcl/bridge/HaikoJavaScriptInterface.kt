package com.tungsten.fcl.bridge

import android.content.Context
import android.webkit.JavascriptInterface
import com.tungsten.fcl.activity.HaikoWebActivity
import org.json.JSONObject

class HaikoJavaScriptInterface(private val activity: HaikoWebActivity) {
    
    private val context: Context = activity
    
    @JavascriptInterface
    fun onBridgeReady() {
        // Le bridge JavaScript est prêt
        println("Haiko Bridge: Interface JavaScript prête")
    }
    
    @JavascriptInterface
    fun getIpcRenderer(): String {
        // Simuler l'objet ipcRenderer d'Electron
        return """
        {
            send: function(channel, data) {
                AndroidBridge.sendIpcMessage(channel, JSON.stringify(data || {}));
            },
            on: function(channel, callback) {
                AndroidBridge.registerIpcListener(channel, callback.toString());
            }
        }
        """.trimIndent()
    }
    
    @JavascriptInterface
    fun sendIpcMessage(channel: String, data: String) {
        when (channel) {
            "main-window-close" -> {
                activity.runOnUiThread {
                    activity.finish()
                }
            }
            "main-window-dev-tools" -> {
                // Mode développement - pas d'action sur Android
                println("Haiko Bridge: Dev tools demandé")
            }
            "main-window-minimize" -> {
                activity.runOnUiThread {
                    activity.moveTaskToBack(true)
                }
            }
            else -> {
                println("Haiko Bridge: Message IPC non géré: $channel avec données: $data")
            }
        }
    }
    
    @JavascriptInterface
    fun registerIpcListener(channel: String, callbackString: String) {
        // Enregistrer les listeners pour les events IPC
        println("Haiko Bridge: Listener enregistré pour: $channel")
    }
    
    @JavascriptInterface
    fun getFileSystem(): String {
        // Simuler le module 'fs' de Node.js pour les fonctions de base
        return """
        {
            existsSync: function(path) {
                return AndroidBridge.fileExists(path);
            },
            readFileSync: function(path, encoding) {
                return AndroidBridge.readFile(path, encoding || 'utf8');
            },
            writeFileSync: function(path, data, encoding) {
                return AndroidBridge.writeFile(path, data, encoding || 'utf8');
            }
        }
        """.trimIndent()
    }
    
    @JavascriptInterface
    fun fileExists(path: String): Boolean {
        return try {
            val file = context.assets.open(path)
            file.close()
            true
        } catch (e: Exception) {
            false
        }
    }
    
    @JavascriptInterface
    fun readFile(path: String, encoding: String): String {
        return try {
            val inputStream = if (path.startsWith("assets://")) {
                context.assets.open(path.substring(9))
            } else {
                context.assets.open(path)
            }
            inputStream.bufferedReader().use { it.readText() }
        } catch (e: Exception) {
            println("Erreur lecture fichier: ${e.message}")
            ""
        }
    }
    
    @JavascriptInterface
    fun writeFile(path: String, data: String, encoding: String): Boolean {
        return try {
            // Pour l'instant, on ne peut pas écrire dans les assets
            // Il faudrait utiliser le storage interne
            println("Haiko Bridge: Écriture fichier demandée: $path")
            true
        } catch (e: Exception) {
            false
        }
    }
    
    @JavascriptInterface
    fun getMinecraftCore(): String {
        // Simuler minecraft-java-core pour l'authentification
        return """
        {
            AZauth: {
                validate: function(username, password) {
                    return AndroidBridge.validateAZauth(username, password);
                }
            },
            Microsoft: {
                login: function() {
                    return AndroidBridge.microsoftLogin();
                }
            },
            Mojang: {
                login: function(username, password) {
                    return AndroidBridge.mojangLogin(username, password);
                }
            }
        }
        """.trimIndent()
    }
    
    @JavascriptInterface
    fun validateAZauth(username: String, password: String): String {
        // Ici on pourra intégrer avec le système d'auth de FCL
        return """{"success": false, "message": "AZauth non implémenté encore"}"""
    }
    
    @JavascriptInterface
    fun microsoftLogin(): String {
        // Ici on pourra intégrer avec le système d'auth Microsoft de FCL
        return """{"success": false, "message": "Microsoft auth non implémenté encore"}"""
    }
    
    @JavascriptInterface
    fun mojangLogin(username: String, password: String): String {
        // Ici on pourra intégrer avec le système d'auth Mojang de FCL
        return """{"success": false, "message": "Mojang auth non implémenté encore"}"""
    }
}