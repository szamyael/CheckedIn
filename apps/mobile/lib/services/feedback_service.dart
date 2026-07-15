import 'package:supabase_flutter/supabase_flutter.dart';

import 'auth_service.dart';

class FeedbackService {
  SupabaseClient get _client => Supabase.instance.client;

  Future<void> submitFeedback({
    required String eventId,
    required int rating,
    String? comment,
  }) async {
    if (AuthService.instance.isOfflineMode || _client.auth.currentUser == null) {
      throw Exception(
        'Feedback requires an internet connection. Try again when online.',
      );
    }

    final userId = AuthService.instance.currentUserId;
    if (userId == null) throw Exception('Not signed in');

    await _client.from('event_feedback').insert({
      'event_id': eventId,
      'student_id': userId,
      'rating': rating,
      'comment': comment?.isEmpty ?? true ? null : comment,
    });
  }
}
