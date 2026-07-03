import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../services/feedback_service.dart';

class EventFeedbackScreen extends StatefulWidget {
  final String eventId;
  final String eventTitle;

  const EventFeedbackScreen({
    super.key,
    required this.eventId,
    required this.eventTitle,
  });

  @override
  State<EventFeedbackScreen> createState() => _EventFeedbackScreenState();
}

class _EventFeedbackScreenState extends State<EventFeedbackScreen> {
  final _comment = TextEditingController();
  final _feedback = FeedbackService();
  int _rating = 5;
  bool _submitting = false;

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      await _feedback.submitFeedback(
        eventId: widget.eventId,
        rating: _rating,
        comment: _comment.text.trim(),
      );
      if (!mounted) return;
      context.go('/home');
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Event feedback')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('How was ${widget.eventTitle}?'),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (i) {
                final star = i + 1;
                return IconButton(
                  onPressed: () => setState(() => _rating = star),
                  icon: Icon(
                    star <= _rating ? Icons.star : Icons.star_border,
                    color: Colors.amber.shade700,
                  ),
                );
              }),
            ),
            TextField(
              controller: _comment,
              decoration: const InputDecoration(
                labelText: 'Comments (optional)',
              ),
              maxLines: 4,
            ),
            const Spacer(),
            FilledButton(
              onPressed: _submitting ? null : _submit,
              child: Text(_submitting ? 'Submitting…' : 'Submit feedback'),
            ),
            TextButton(
              onPressed: _submitting ? null : () => context.go('/home'),
              child: const Text('Skip'),
            ),
          ],
        ),
      ),
    );
  }
}
