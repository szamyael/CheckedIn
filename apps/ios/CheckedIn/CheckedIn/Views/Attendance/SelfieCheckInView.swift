import SwiftUI
import UIKit

struct SelfieCheckInView: View {
    let payload: CheckInPayload
    @EnvironmentObject private var loader: LoaderStore
    @State private var image: UIImage?
    @State private var showCamera = false
    @State private var message: String?
    @State private var success = false

    var body: some View {
        VStack(spacing: 16) {
            Text("Step 3 of 3 — Live selfie")
                .font(.title3.weight(.semibold))
            Text("Take a live camera selfie to complete check-in for \(payload.eventTitle).")
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)

            if let image {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFit()
                    .frame(maxHeight: 280)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }

            if let message {
                Text(message)
                    .foregroundStyle(success ? Color(red: 0.08, green: 0.72, blue: 0.65) : .red)
                    .multilineTextAlignment(.center)
            }

            Spacer()

            Button(image == nil ? "Open Camera" : "Retake") {
                showCamera = true
            }
            .buttonStyle(.bordered)

            Button("Submit Check-in") {
                Task { await submit() }
            }
            .buttonStyle(.borderedProminent)
            .tint(Color(red: 0.08, green: 0.72, blue: 0.65))
            .disabled(image == nil || success)
        }
        .padding(24)
        .navigationTitle("Selfie")
        .sheet(isPresented: $showCamera) {
            CameraPicker(image: $image)
        }
    }

    private func submit() async {
        guard let image else { return }
        message = nil
        do {
            try await loader.during("Submitting check-in…") {
                let service = AttendanceService()
                let location = try await service.currentLocation()
                let path = try await service.uploadSelfie(image: image)
                try await service.checkIn(
                    qrToken: payload.qrToken,
                    latitude: location.coordinate.latitude,
                    longitude: location.coordinate.longitude,
                    selfiePath: path,
                    otpCode: payload.otpCode,
                    eventId: payload.eventId
                )
            }
            success = true
            message = "Checked in successfully."
        } catch {
            message = error.localizedDescription
        }
    }
}

struct CameraPicker: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = UIImagePickerController.isSourceTypeAvailable(.camera) ? .camera : .photoLibrary
        picker.cameraDevice = .front
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    final class Coordinator: NSObject, UINavigationControllerDelegate, UIImagePickerControllerDelegate {
        let parent: CameraPicker
        init(_ parent: CameraPicker) { self.parent = parent }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }

        func imagePickerController(
            _ picker: UIImagePickerController,
            didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]
        ) {
            parent.image = info[.originalImage] as? UIImage
            parent.dismiss()
        }
    }
}
