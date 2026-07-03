import 'package:supabase_flutter/supabase_flutter.dart';

class FeedbackService {
  SupabaseClient get _client => Supabase.instance.client;

  Future<void> submitFeedback({
    required String eventId,
    required int rating,
    String? comment,
  }) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) throw Exception('Not signed in');

    await _client.from('event_feedback').insert({
      'event_id': eventId,
      'student_id': userId,
      'rating': rating,
      'comment': comment?.isEmpty ?? true ? null : comment,
    });
  }
}
