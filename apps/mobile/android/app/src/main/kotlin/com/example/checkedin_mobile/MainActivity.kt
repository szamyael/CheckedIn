package com.example.checkedin_mobile

import android.view.WindowManager
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        super.onCreate(savedInstanceState)
    }
}
