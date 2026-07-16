import SwiftUI
import AVFoundation

struct QRScanView: View {
    @EnvironmentObject private var loader: LoaderStore
    @State private var scannedToken: String?
    @State private var path = NavigationPath()
    @State private var error: String?
    @State private var resultTitle: String?
    @State private var resultBody: String?

    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                QRScannerRepresentable { raw in
                    guard scannedToken == nil else { return }
                    let service = AttendanceService()
                    guard let token = service.parseQrToken(raw) else {
                        error = "Invalid QR code. Scan a CheckedIn event code."
                        return
                    }
                    scannedToken = token
                    Task { await resolve(token: token) }
                }
                VStack {
                    Spacer()
                    Text("Scan event QR to check in or check out")
                        .padding()
                        .background(.ultraThinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .padding()
                }
            }
            .navigationTitle("Scan")
            .navigationDestination(for: AttendanceRoute.self) { route in
                switch route {
                case .location(let token):
                    LocationCheckView(qrToken: token, path: $path)
                case .otp(let payload):
                    OTPView(payload: payload, path: $path)
                case .selfie(let payload):
                    SelfieCheckInView(payload: payload)
                }
            }
            .alert("Notice", isPresented: Binding(
                get: { resultTitle != nil || error != nil },
                set: { if !$0 { resultTitle = nil; error = nil; scannedToken = nil } }
            )) {
                Button("OK") {
                    resultTitle = nil
                    error = nil
                    scannedToken = nil
                }
            } message: {
                Text(resultBody ?? error ?? "")
            }
        }
    }

    private func resolve(token: String) async {
        do {
            let meta = try await loader.during("Checking attendance…") {
                try await AttendanceService().fetchMeta(qrToken: token)
            }
            if meta.already_checked_out == true {
                resultTitle = "Already checked out"
                resultBody = "You already checked out of \(meta.title ?? "this event")."
                return
            }
            if meta.can_check_out == true {
                try await loader.during("Checking out…") {
                    try await AttendanceService().checkOut(qrToken: token)
                }
                resultTitle = "Checked out"
                resultBody = "Checked out of \(meta.title ?? "event"). No OTP or selfie required."
                return
            }
            path.append(AttendanceRoute.location(token))
        } catch {
            self.error = error.localizedDescription
            scannedToken = nil
        }
    }
}

enum AttendanceRoute: Hashable {
    case location(String)
    case otp(CheckInPayload)
    case selfie(CheckInPayload)
}

struct CheckInPayload: Hashable {
    var qrToken: String
    var latitude: Double
    var longitude: Double
    var requiresOtp: Bool
    var eventTitle: String
    var eventId: String?
    var otpCode: String?
}

struct QRScannerRepresentable: UIViewControllerRepresentable {
    let onCode: (String) -> Void

    func makeUIViewController(context: Context) -> QRScannerController {
        let controller = QRScannerController()
        controller.onCode = onCode
        return controller
    }

    func updateUIViewController(_ uiViewController: QRScannerController, context: Context) {}
}

final class QRScannerController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    var onCode: ((String) -> Void)?
    private let session = AVCaptureSession()
    private var handled = false

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        guard let device = AVCaptureDevice.default(for: .video),
              let input = try? AVCaptureDeviceInput(device: device),
              session.canAddInput(input) else { return }
        session.addInput(input)
        let output = AVCaptureMetadataOutput()
        guard session.canAddOutput(output) else { return }
        session.addOutput(output)
        output.setMetadataObjectsDelegate(self, queue: .main)
        output.metadataObjectTypes = [.qr]
        let preview = AVCaptureVideoPreviewLayer(session: session)
        preview.frame = view.bounds
        preview.videoGravity = .resizeAspectFill
        view.layer.addSublayer(preview)
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.session.startRunning()
        }
    }

    func metadataOutput(
        _ output: AVCaptureMetadataOutput,
        didOutput metadataObjects: [AVMetadataObject],
        from connection: AVCaptureConnection
    ) {
        guard !handled,
              let object = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
              let value = object.stringValue else { return }
        handled = true
        onCode?(value)
    }
}
