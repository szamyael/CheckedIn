import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var session: SessionStore
    @EnvironmentObject private var loader: LoaderStore

    @State private var studentId = ""
    @State private var password = ""
    @State private var error: String?

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Spacer()
                Image("Logo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 140, height: 140)
                Text("Student Attendance")
                    .foregroundStyle(Color(white: 0.35))

                TextField("Student ID (0XXX-XXXX)", text: $studentId)
                    .keyboardType(.numberPad)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .padding()
                    .background(Color(white: 0.96))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .onChange(of: studentId) { _, newValue in
                        let formatted = AppConfig.formatStudentIdInput(newValue)
                        if formatted != newValue {
                            studentId = formatted
                        }
                    }

                SecureField("Password", text: $password)
                    .padding()
                    .background(Color(white: 0.96))
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                if let error {
                    Text(error)
                        .foregroundStyle(.red)
                        .font(.footnote)
                        .multilineTextAlignment(.center)
                }

                Button {
                    Task { await signIn() }
                } label: {
                    Text("Sign In")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(red: 0.08, green: 0.72, blue: 0.65))
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                Spacer()
            }
            .padding(24)
            .navigationTitle("CheckedIn")
        }
    }

    private func signIn() async {
        error = nil
        do {
            try await loader.during("Signing in…") {
                try await session.signIn(studentId: studentId, password: password)
            }
        } catch {
            self.error = error.localizedDescription
        }
    }
}
