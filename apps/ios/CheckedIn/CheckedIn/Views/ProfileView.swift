import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var session: SessionStore
    @EnvironmentObject private var loader: LoaderStore

    var body: some View {
        NavigationStack {
            Form {
                Section("Account") {
                    if let studentId = session.studentId {
                        Text("Student ID: \(studentId)")
                    }
                    Text("Signed in")
                }
                Section {
                    Button("Sign out", role: .destructive) {
                        Task {
                            await loader.during("Signing out…") {
                                await session.signOut()
                            }
                        }
                    }
                }
            }
            .navigationTitle("Profile")
        }
    }
}
