import SwiftUI

struct LocationCheckView: View {
    let qrToken: String
    @Binding var path: NavigationPath
    @EnvironmentObject private var loader: LoaderStore
    @State private var error: String?

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "location.fill")
                .font(.system(size: 56))
                .foregroundStyle(Color(red: 0.08, green: 0.72, blue: 0.65))
            Text("Step 1 of 3 — Location")
                .font(.title3.weight(.semibold))
            Text("You must be inside the event geofence before OTP or selfie.")
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
            if let error {
                Text(error).foregroundStyle(.red).multilineTextAlignment(.center)
            }
            Spacer()
            Button("Verify My Location") {
                Task { await verify() }
            }
            .buttonStyle(.borderedProminent)
            .tint(Color(red: 0.08, green: 0.72, blue: 0.65))
        }
        .padding(24)
        .navigationTitle("Verify Location")
    }

    private func verify() async {
        error = nil
        do {
            let service = AttendanceService()
            let location = try await loader.during("Getting GPS…") {
                try await service.currentLocation()
            }
            let meta = try await loader.during("Verifying location…") {
                try await service.verifyLocation(
                    qrToken: qrToken,
                    latitude: location.coordinate.latitude,
                    longitude: location.coordinate.longitude
                )
            }
            guard meta.location_ok == true else {
                error = meta.error ?? "Outside event location"
                return
            }
            path.append(
                AttendanceRoute.otp(
                    CheckInPayload(
                        qrToken: qrToken,
                        latitude: location.coordinate.latitude,
                        longitude: location.coordinate.longitude,
                        requiresOtp: meta.requires_otp == true,
                        eventTitle: meta.title ?? "Event",
                        eventId: meta.id?.uuidString
                    )
                )
            )
        } catch {
            self.error = error.localizedDescription
        }
    }
}
