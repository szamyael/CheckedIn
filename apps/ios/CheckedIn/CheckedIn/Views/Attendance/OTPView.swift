import SwiftUI

struct OTPView: View {
    let payload: CheckInPayload
    @Binding var path: NavigationPath
    @State private var code = ""

    var body: some View {
        VStack(spacing: 16) {
            Text(payload.eventTitle).font(.headline)
            if payload.requiresOtp {
                Text("Enter the attendance OTP shown by your instructor.")
                    .multilineTextAlignment(.center)
                TextField("6-digit OTP", text: $code)
                    .keyboardType(.numberPad)
                    .padding()
                    .background(Color(white: 0.96))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            } else {
                Text("This event does not require an OTP. Continue to selfie verification.")
                    .multilineTextAlignment(.center)
            }
            Spacer()
            Button("Continue") {
                var next = payload
                next.otpCode = payload.requiresOtp ? code : nil
                path.append(AttendanceRoute.selfie(next))
            }
            .buttonStyle(.borderedProminent)
            .tint(Color(red: 0.08, green: 0.72, blue: 0.65))
            .disabled(payload.requiresOtp && code.trimmingCharacters(in: .whitespaces).isEmpty)
        }
        .padding(24)
        .navigationTitle("Attendance OTP")
    }
}
