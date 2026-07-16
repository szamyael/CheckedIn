import Foundation
import CoreLocation
import Supabase
import UIKit

struct EventItem: Identifiable, Decodable {
    let id: UUID
    let title: String
    let venue_name: String?
    let description: String?
    let starts_at: Date
    let ends_at: Date
    let attendance_starts_at: Date?
    let attendance_ends_at: Date?
}

struct CheckInMeta: Decodable {
    let id: UUID?
    let title: String?
    let requires_otp: Bool?
    let can_check_out: Bool?
    let already_checked_out: Bool?
    let my_attendance_status: String?
    let location_ok: Bool?
    let distance_m: Int?
    let allowed_radius_m: Int?
    let error: String?
}

final class AttendanceService: NSObject, CLLocationManagerDelegate {
    private let client = SupabaseManager.shared.client
    private let locationManager = CLLocationManager()
    private var locationContinuation: CheckedContinuation<CLLocation, Error>?

    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
    }

    func parseQrToken(_ raw: String) -> String? {
        if let data = raw.data(using: .utf8),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           json["type"] as? String == AppConfig.qrEventType,
           let token = json["qr_token"] as? String {
            return token
        }
        let uuid = UUID(uuidString: raw)
        return uuid != nil ? raw : nil
    }

    func fetchMeta(qrToken: String) async throws -> CheckInMeta {
        struct Body: Encodable { let qr_token: String }
        return try await client.functions.invoke(
            "event-check-in-meta",
            options: FunctionInvokeOptions(body: Body(qr_token: qrToken))
        )
    }

    func verifyLocation(qrToken: String, latitude: Double, longitude: Double) async throws -> CheckInMeta {
        struct Body: Encodable {
            let qr_token: String
            let latitude: Double
            let longitude: Double
        }
        return try await client.functions.invoke(
            "event-check-in-meta",
            options: FunctionInvokeOptions(
                body: Body(qr_token: qrToken, latitude: latitude, longitude: longitude)
            )
        )
    }

    func checkOut(qrToken: String) async throws {
        struct Body: Encodable { let qr_token: String }
        struct Payload: Decodable {
            let success: Bool?
            let error: String?
        }
        let payload: Payload = try await client.functions.invoke(
            "check-out",
            options: FunctionInvokeOptions(body: Body(qr_token: qrToken))
        )
        if payload.success != true {
            throw AppError.message(payload.error ?? "Check-out failed")
        }
    }

    func checkIn(
        qrToken: String,
        latitude: Double,
        longitude: Double,
        selfiePath: String,
        otpCode: String?,
        eventId: String?
    ) async throws {
        struct Body: Encodable {
            let qr_token: String
            let latitude: Double
            let longitude: Double
            let selfie_path: String
            let otp_code: String?
            let event_id: String?
        }
        struct Payload: Decodable {
            let success: Bool?
            let error: String?
        }
        let payload: Payload = try await client.functions.invoke(
            "check-in",
            options: FunctionInvokeOptions(
                body: Body(
                    qr_token: qrToken,
                    latitude: latitude,
                    longitude: longitude,
                    selfie_path: selfiePath,
                    otp_code: otpCode,
                    event_id: eventId
                )
            )
        )
        if payload.success != true {
            throw AppError.message(payload.error ?? "Check-in failed")
        }
    }

    func uploadSelfie(image: UIImage) async throws -> String {
        guard let jpeg = image.jpegData(compressionQuality: 0.85) else {
            throw AppError.message("Could not encode selfie")
        }
        let session = try await client.auth.session
        let userId = session.user.id.uuidString.lowercased()
        let path = "\(userId)/\(Int(Date().timeIntervalSince1970 * 1000)).jpg"
        try await client.storage.from("selfies").upload(
            path,
            data: jpeg,
            options: FileOptions(contentType: "image/jpeg", upsert: true)
        )
        return path
    }

    func currentLocation() async throws -> CLLocation {
        let status = locationManager.authorizationStatus
        if status == .notDetermined {
            locationManager.requestWhenInUseAuthorization()
        }
        return try await withCheckedThrowingContinuation { continuation in
            self.locationContinuation = continuation
            self.locationManager.requestLocation()
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        locationContinuation?.resume(returning: location)
        locationContinuation = nil
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        locationContinuation?.resume(throwing: error)
        locationContinuation = nil
    }

    func listPublishedEvents() async throws -> [EventItem] {
        try await client
            .from("events")
            .select("id,title,venue_name,description,starts_at,ends_at,attendance_starts_at,attendance_ends_at")
            .eq("status", value: "published")
            .order("starts_at", ascending: true)
            .execute()
            .value
    }
}
