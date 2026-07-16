import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            EventsHomeView()
                .tabItem { Label("Events", systemImage: "calendar") }
            QRScanView()
                .tabItem { Label("Scan", systemImage: "qrcode.viewfinder") }
            ProfileView()
                .tabItem { Label("Profile", systemImage: "person") }
        }
        .tint(Color(red: 0.08, green: 0.72, blue: 0.65))
    }
}
