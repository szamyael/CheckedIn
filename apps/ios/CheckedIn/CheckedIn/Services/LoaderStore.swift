import Foundation
import Combine

@MainActor
final class LoaderStore: ObservableObject {
    @Published var isVisible = false
    @Published var message = "Please wait…"

    func show(_ message: String = "Please wait…") {
        self.message = message
        isVisible = true
    }

    func hide() {
        isVisible = false
    }

    func during<T>(_ message: String = "Please wait…", _ work: () async throws -> T) async rethrows -> T {
        show(message)
        defer { hide() }
        return try await work()
    }
}
