import Foundation
import Combine
import Supabase

@MainActor
final class SessionStore: ObservableObject {
    @Published var isSignedIn = false
    @Published var userId: String?
    @Published var studentId: String?

    private let client = SupabaseManager.shared.client

    init() {
        Task { await refresh() }
    }

    func refresh() async {
        do {
            let session = try await client.auth.session
            isSignedIn = true
            userId = session.user.id.uuidString
        } catch {
            isSignedIn = false
            userId = nil
        }
    }

    func signIn(studentId raw: String, password: String) async throws {
        guard let normalized = AppConfig.normalizeStudentId(raw) ?? (AppConfig.isValidStudentId(raw) ? raw : nil) else {
            throw AppError.message("Enter a valid Student ID (0XXX-XXXX).")
        }

        let email = try await resolveEmail(for: normalized)
        _ = try await client.auth.signIn(email: email, password: password)
        studentId = normalized
        await refresh()
    }

    func signOut() async {
        try? await client.auth.signOut()
        isSignedIn = false
        userId = nil
        studentId = nil
    }

    private func resolveEmail(for studentId: String) async throws -> String {
        struct Body: Encodable { let student_id: String }
        struct Payload: Decodable {
            let email: String?
            let error: String?
        }

        do {
            let response: Payload = try await client.functions.invoke(
                "student-resolve-email",
                options: FunctionInvokeOptions(body: Body(student_id: studentId))
            )
            if let email = response.email, !email.isEmpty { return email }
            if let err = response.error { throw AppError.message(err) }
            throw AppError.message("No email on file for this student.")
        } catch let error as AppError {
            throw error
        } catch {
            throw AppError.message(error.localizedDescription)
        }
    }
}

enum AppError: LocalizedError {
    case message(String)
    var errorDescription: String? {
        switch self {
        case .message(let text): return text
        }
    }
}
