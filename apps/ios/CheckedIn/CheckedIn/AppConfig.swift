import Foundation

enum AppConfig {
    static var supabaseURL: URL {
        let raw = value(for: "SUPABASE_URL")
            ?? ProcessInfo.processInfo.environment["SUPABASE_URL"]
            ?? "https://example.supabase.co"
        return URL(string: raw) ?? URL(string: "https://example.supabase.co")!
    }

    static var supabaseAnonKey: String {
        value(for: "SUPABASE_ANON_KEY")
            ?? ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"]
            ?? ""
    }

    static let studentEmailDomain = "@student.checkedin.local"
    static let qrEventType = "checkedin_event"
    static let studentIdPattern = #"^0\d{3}-\d{4}$"#

    private static func value(for key: String) -> String? {
        if let path = Bundle.main.path(forResource: "Config", ofType: "plist"),
           let dict = NSDictionary(contentsOfFile: path) as? [String: String] {
            return dict[key]
        }
        return Bundle.main.object(forInfoDictionaryKey: key) as? String
    }

    static func normalizeStudentId(_ raw: String) -> String? {
        let digits = raw.filter(\.isNumber)
        guard digits.count == 8, digits.hasPrefix("0") else { return nil }
        let start = digits.index(digits.startIndex, offsetBy: 4)
        return "\(digits[..<start])-\(digits[start...])"
    }

    static func formatStudentIdInput(_ raw: String) -> String {
        let digits = String(raw.filter(\.isNumber).prefix(8))
        if digits.count <= 4 { return digits }
        let idx = digits.index(digits.startIndex, offsetBy: 4)
        return "\(digits[..<idx])-\(digits[idx...])"
    }

    static func isValidStudentId(_ id: String) -> Bool {
        id.range(of: studentIdPattern, options: .regularExpression) != nil
    }

    static func studentAuthEmail(_ studentId: String) -> String {
        "\(studentId.lowercased())\(studentEmailDomain)"
    }
}
