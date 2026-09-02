import 'package:supabase_flutter/supabase_flutter.dart';

class BingoBoardData {
  final String cardId;
  final String title;
  final String seasonLabel;
  final int streakThreshold;
  final List<BingoCellView> cells;
  final Set<String> completedCellIds;
  final List<BingoBadgeAward> awards;

  BingoBoardData({
    required this.cardId,
    required this.title,
    required this.seasonLabel,
    required this.streakThreshold,
    required this.cells,
    required this.completedCellIds,
    required this.awards,
  });

  int get streak {
    final ordered = [...cells]..sort((a, b) {
        final ta = a.startsAt?.millisecondsSinceEpoch ?? 0;
        final tb = b.startsAt?.millisecondsSinceEpoch ?? 0;
        return ta.compareTo(tb);
      });
    var best = 0;
    var run = 0;
    for (final c in ordered) {
      if (c.eventId == null) continue;
      if (completedCellIds.contains(c.id)) {
        run += 1;
        if (run > best) best = run;
      } else {
        run = 0;
      }
    }
    return best;
  }

  bool get hasLine {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    final done = <int>{};
    for (final c in cells) {
      if (completedCellIds.contains(c.id)) done.add(c.position);
    }
    return lines.any((line) => line.every(done.contains));
  }
}

class BingoCellView {
  final String id;
  final int position;
  final String? eventId;
  final String? label;
  final String? eventTitle;
  final DateTime? startsAt;

  BingoCellView({
    required this.id,
    required this.position,
    this.eventId,
    this.label,
    this.eventTitle,
    this.startsAt,
  });
}

class BingoBadgeAward {
  final String id;
  final String name;
  final int points;
  final DateTime earnedAt;

  BingoBadgeAward({
    required this.id,
    required this.name,
    required this.points,
    required this.earnedAt,
  });
}

class BingoService {
  SupabaseClient get _client => Supabase.instance.client;

  Future<BingoBoardData?> fetchActiveBoard() async {
    final user = _client.auth.currentUser;
    if (user == null) return null;

    final cards = await _client
        .from('bingo_cards')
        .select('id, title, season_label, streak_threshold')
        .eq('status', 'active')
        .limit(1);

    if ((cards as List).isEmpty) return null;
    final card = cards.first as Map<String, dynamic>;

    final cellRows = await _client
        .from('bingo_cells')
        .select('id, position, event_id, label, events(title, starts_at)')
        .eq('card_id', card['id'] as String)
        .order('position');

    final cells = (cellRows as List).map((raw) {
      final row = raw as Map<String, dynamic>;
      final events = row['events'];
      Map<String, dynamic>? eventMap;
      if (events is Map<String, dynamic>) {
        eventMap = events;
      } else if (events is List && events.isNotEmpty) {
        eventMap = events.first as Map<String, dynamic>;
      }
      return BingoCellView(
        id: row['id'] as String,
        position: row['position'] as int,
        eventId: row['event_id'] as String?,
        label: row['label'] as String?,
        eventTitle: eventMap?['title'] as String?,
        startsAt: eventMap?['starts_at'] != null
            ? DateTime.tryParse(eventMap!['starts_at'] as String)
            : null,
      );
    }).toList();

    final doneRows = await _client
        .from('student_bingo_cells')
        .select('cell_id')
        .eq('student_id', user.id);

    final completed = {
      for (final r in (doneRows as List))
        (r as Map<String, dynamic>)['cell_id'] as String,
    };

    final awardRows = await _client
        .from('student_org_badges')
        .select('id, points_awarded, earned_at, org_badges(name)')
        .eq('student_id', user.id)
        .order('earned_at', ascending: false);

    final awards = (awardRows as List).map((raw) {
      final row = raw as Map<String, dynamic>;
      final badge = row['org_badges'];
      String name = 'Badge';
      if (badge is Map<String, dynamic>) {
        name = badge['name'] as String? ?? name;
      } else if (badge is List && badge.isNotEmpty) {
        name = (badge.first as Map<String, dynamic>)['name'] as String? ?? name;
      }
      return BingoBadgeAward(
        id: row['id'] as String,
        name: name,
        points: row['points_awarded'] as int? ?? 0,
        earnedAt: DateTime.parse(row['earned_at'] as String),
      );
    }).toList();

    return BingoBoardData(
      cardId: card['id'] as String,
      title: card['title'] as String,
      seasonLabel: card['season_label'] as String? ?? '',
      streakThreshold: card['streak_threshold'] as int? ?? 3,
      cells: cells,
      completedCellIds: completed,
      awards: awards,
    );
  }
}
