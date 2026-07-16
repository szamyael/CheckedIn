import SwiftUI

@main
struct CheckedInApp: App {
    @StateObject private var session = SessionStore()
    @StateObject private var loader = LoaderStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(session)
                .environmentObject(loader)
                .overlay {
                    if loader.isVisible {
                        UniversalLoaderOverlay(message: loader.message)
                    }
                }
        }
    }
}

struct RootView: View {
    @EnvironmentObject private var session: SessionStore

    var body: some View {
        Group {
            if session.isSignedIn {
                MainTabView()
            } else {
                LoginView()
            }
        }
        .animation(.easeInOut(duration: 0.2), value: session.isSignedIn)
    }
}
