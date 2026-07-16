import SwiftUI

struct EventsHomeView: View {
    @EnvironmentObject private var loader: LoaderStore
    @State private var events: [EventItem] = []
    @State private var error: String?

    var body: some View {
        NavigationStack {
            List(events) { event in
                VStack(alignment: .leading, spacing: 4) {
                    Text(event.title).font(.headline)
                    Text(event.venue_name ?? "Venue TBA")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Events")
            .overlay {
                if events.isEmpty && error == nil {
                    ContentUnavailableView("No events", systemImage: "calendar")
                }
            }
            .refreshable { await load() }
            .task { await load() }
            .alert("Error", isPresented: Binding(
                get: { error != nil },
                set: { if !$0 { error = nil } }
            )) {
                Button("OK") { error = nil }
            } message: {
                Text(error ?? "")
            }
        }
    }

    private func load() async {
        do {
            events = try await loader.during("Loading events…") {
                try await AttendanceService().listPublishedEvents()
            }
        } catch {
            self.error = error.localizedDescription
        }
    }
}
