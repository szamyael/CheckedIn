import Foundation
import Supabase

enum SupabaseManager {
    static let shared = ClientHolder()

    final class ClientHolder {
        let client: SupabaseClient

        init() {
            client = SupabaseClient(
                supabaseURL: AppConfig.supabaseURL,
                supabaseKey: AppConfig.supabaseAnonKey
            )
        }
    }
}
