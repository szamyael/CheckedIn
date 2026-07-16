import SwiftUI

struct UniversalLoaderOverlay: View {
    let message: String

    var body: some View {
        ZStack {
            Color.black.opacity(0.45).ignoresSafeArea()
            VStack(spacing: 16) {
                ProgressView()
                    .tint(Color(red: 0.08, green: 0.72, blue: 0.65))
                    .scaleEffect(1.3)
                Text(message)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)
                Text("Process is ongoing…")
                    .font(.caption)
                    .foregroundStyle(Color(white: 0.65))
            }
            .padding(.horizontal, 28)
            .padding(.vertical, 24)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color(white: 0.25), lineWidth: 1)
                    )
            )
        }
        .allowsHitTesting(true)
    }
}
