import 'package:supabase_flutter/supabase_flutter.dart';

import 'local_cache_service.dart';

const _bingoLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

Set<String> completedBingoCellIds(
  List<BingoCellView> cells,
  Set<String> attendedEventIds,
) =>
    cells
        .where(
          (cell) =>
              cell.eventId != null && attendedEventIds.contains(cell.eventId),
        )
        .map((cell) => cell.id)
        .toSet();

class BingoCardSummary {
  final String id;
  final String title;
  final String seasonLabel;
  final int streakThreshold;

  BingoCardSummary({
    required this.id,
    required this.title,
    required this.seasonLabel,
    required this.streakThreshold,
  });
}

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
        final byStartTime = ta.compareTo(tb);
        return byStartTime != 0 ? byStartTime : a.position.compareTo(b.position);
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

  List<List<int>> get completedLines {
    final done = <int>{};
    for (final c in cells) {
      if (completedCellIds.contains(c.id)) done.add(c.position);
    }
    return _bingoLines
        .where((line) => line.every(done.contains))
        .map((line) => List<int>.unmodifiable(line))
        .toList();
  }

  bool get hasLine => completedLines.isNotEmpty;
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

  Future<List<BingoCardSummary>> fetchPublishedCards() async {
    final rows = await _client
        .from('bingo_cards')
        .select('id, title, season_label, streak_threshold')
        .eq('is_active', true)
        .order('updated_at', ascending: false);

    return (rows as List).map((raw) {
      final row = raw as Map<String, dynamic>;
      return BingoCardSummary(
        id: row['id'] as String,
        title: row['title'] as String,
        seasonLabel: row['season_label'] as String? ?? '',
        streakThreshold: row['streak_threshold'] as int? ?? 3,
      );
    }).toList();
  }

  Future<String?> readSavedCardId() {
    return LocalCacheService.instance.readJson<String>(
      CacheKeys.bingoSelectedCard,
      (raw) => raw is String ? raw : null,
    );
  }

  Future<void> saveSelectedCardId(String cardId) {
    return LocalCacheService.instance.writeJson(CacheKeys.bingoSelectedCard, cardId);
  }

  Future<BingoBoardData?> fetchBoard(String cardId) async {
    final user = _client.auth.currentUser;
    if (user == null) return null;

    final cardRow = await _client
        .from('bingo_cards')
        .select('id, title, season_label, streak_threshold')
        .eq('id', cardId)
        .eq('is_active', true)
        .maybeSingle();
    if (cardRow == null) return null;

    final cellRows = await _client
        .from('bingo_cells')
        .select('id, position, event_id, label, events(title, starts_at)')
        .eq('card_id', cardId)
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

    final eventIds = cells
        .map((cell) => cell.eventId)
        .whereType<String>()
        .toSet()
        .toList();
    final attendedEventIds = <String>{};
    if (eventIds.isNotEmpty) {
      final attendanceRows = await _client
          .from('attendance_records')
          .select('event_id')
          .eq('student_id', user.id)
          .inFilter('event_id', eventIds)
          .inFilter('status', ['checked_in', 'late', 'on_break', 'checked_out']);
      for (final row in (attendanceRows as List)) {
        attendedEventIds.add(
          (row as Map<String, dynamic>)['event_id'] as String,
        );
      }
    }
    final completed = completedBingoCellIds(cells, attendedEventIds);

    final awardRows = await _client
        .from('student_org_badges')
        .select('id, points_awarded, earned_at, org_badges(name)')
        .eq('student_id', user.id)
        .eq('bingo_card_id', cardId)
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
      cardId: cardRow['id'] as String,
      title: cardRow['title'] as String,
      seasonLabel: cardRow['season_label'] as String? ?? '',
      streakThreshold: cardRow['streak_threshold'] as int? ?? 3,
      cells: cells,
      completedCellIds: completed,
      awards: awards,
    );
  }
}
