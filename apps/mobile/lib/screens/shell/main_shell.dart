import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:tabler_icons_plus/tabler_icons_plus.dart';

import '../../services/auth_service.dart';
import '../../services/connectivity_service.dart';
import '../../services/notification_service.dart';
import '../../services/offline_sync_service.dart';
import '../bingo/bingo_screen.dart';
import '../events/events_screen.dart';
import '../profile/profile_screen.dart';
import '../home/home_screen.dart';
import '../../widgets/app_logo.dart';
import '../../widgets/student_ui.dart';
import '../../widgets/appearance_sheet.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;
  final _notifications = NotificationService();
  final _offlineSync = OfflineSyncService.instance;
  final _auth = AuthService.instance;
  final _connectivity = ConnectivityService.instance;
  int _unreadCount = 0;
  String? _accountStatus;
  bool _accessBlocked = false;

  @override
  void initState() {
    super.initState();
    _refreshUnread();
    _loadAccountStatus();
    _notifications.subscribeToNew(_showIncomingNotification, playSound: true);
    _offlineSync.addListener(_onOfflineChanged);
    _connectivity.addListener(_onOfflineChanged);
    _auth.addListener(_onOfflineChanged);
  }

  Future<void> _loadAccountStatus() async {
    final status = await _auth.fetchAccountStatus();
    if (mounted) {
      setState(() {
        _accountStatus = status;
        _accessBlocked = status != null && status != 'active';
      });
    }
  }

  @override
  void dispose() {
    _offlineSync.removeListener(_onOfflineChanged);
    _connectivity.removeListener(_onOfflineChanged);
    _auth.removeListener(_onOfflineChanged);
    super.dispose();
  }

  void _onOfflineChanged() {
    if (mounted) setState(() {});
  }

  Future<void> _refreshUnread() async {
    final count = await _notifications.fetchUnreadCount();
    if (mounted) setState(() => _unreadCount = count);
  }

  void _showIncomingNotification(AppNotification notification) {
    _refreshUnread();
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Row(
            children: [
              if (notification.senderName != null) ...[
                CircleAvatar(
                  radius: 16,
                  backgroundColor: Theme.of(
                    context,
                  ).colorScheme.primaryContainer,
                  child: notification.senderAvatarUrl != null
                      ? ClipOval(
                          child: Image.network(
                            notification.senderAvatarUrl!,
                            width: 32,
                            height: 32,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) => Text(
                              _senderInitials(notification.senderName!),
                              style: const TextStyle(fontSize: 10),
                            ),
                          ),
                        )
                      : Text(
                          _senderInitials(notification.senderName!),
                          style: const TextStyle(fontSize: 10),
                        ),
                ),
                const SizedBox(width: 10),
              ],
              Expanded(
                child: Text(
                  notification.senderName == null
                      ? '${notification.title}\n${notification.body}'
                      : '${notification.senderName}: ${notification.title}\n${notification.body}',
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          action: SnackBarAction(
            label: 'View',
            onPressed: () => context.push('/notifications'),
          ),
        ),
      );
  }

  String _senderInitials(String name) => name
      .trim()
      .split(RegExp(r'\s+'))
      .where((part) => part.isNotEmpty)
      .take(2)
      .map((part) => part[0].toUpperCase())
      .join();

  @override
  Widget build(BuildContext context) {
    final reduceMotion = MediaQuery.of(context).disableAnimations;
    if (_accessBlocked) {
      final underReview = _accountStatus == 'pending';
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  underReview ? TablerIcons.hourglass : TablerIcons.ban,
                  size: 48,
                  color: Theme.of(context).colorScheme.error,
                ),
                const SizedBox(height: 16),
                Text(
                  underReview
                      ? 'Your account is still under review.'
                      : 'Your account is suspended.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 8),
                const Text(
                  "Contact your program's organization to settle your account status.",
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: () async {
                    await _auth.signOut();
                    if (context.mounted) context.go('/login');
                  },
                  child: const Text('Return to sign in'),
                ),
              ],
            ),
          ),
        ),
      );
    }
    final pages = [
      HomeScreen(
        onScan: () => context.push('/attendance/scan'),
        onOpenBingo: () => setState(() => _index = 2),
        onOpenNotifications: () => context.push('/notifications'),
      ),
      const EventsScreen(),
      const BingoScreen(),
      const ProfileScreen(),
    ];

    final networkOffline = _connectivity.isOffline;
    final offlineAuth = _auth.isOfflineMode;

    return Scaffold(
      appBar: AppBar(
        title: const AppBrand(),
        centerTitle: false,
        titleSpacing: 16,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            height: 1,
            color: Theme.of(context).colorScheme.outline,
          ),
        ),
        actions: [
          IconButton(
            tooltip: 'Appearance',
            onPressed: () => showAppearanceSheet(context),
            icon: const Icon(TablerIcons.palette),
          ),
          IconButton(
            tooltip: 'Notifications',
            onPressed: () async {
              await context.push('/notifications');
              _refreshUnread();
            },
            icon: Badge(
              isLabelVisible: _unreadCount > 0,
              label: Text(_unreadCount > 9 ? '9+' : '$_unreadCount'),
              child: const Icon(TablerIcons.bell),
            ),
          ),
          IconButton(
            tooltip: 'Sign out',
            icon: const Icon(TablerIcons.logout),
            onPressed: () async {
              await AuthService.instance.signOut();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
      body: Column(
        children: [
          if (networkOffline || offlineAuth || _offlineSync.pendingCount > 0)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: Column(
                children: [
                  if (networkOffline || offlineAuth)
                    StudentInfoBanner(
                      message: networkOffline
                          ? 'No internet — showing cached data. Offline attendance will sync for staff review when you reconnect.'
                          : 'Offline sign-in session — reconnect your account online to sync attendance for staff review.',
                      icon: networkOffline
                          ? TablerIcons.wifiOff
                          : TablerIcons.userOff,
                      background: Theme.of(
                        context,
                      ).colorScheme.surfaceContainerHighest,
                      border: Theme.of(context).colorScheme.outline,
                      foreground: Theme.of(
                        context,
                      ).colorScheme.onSurfaceVariant,
                      action: offlineAuth && !networkOffline
                          ? TextButton(
                              onPressed: _signInOnline,
                              child: const Text('Sign in online'),
                            )
                          : null,
                    ),
                  if ((networkOffline || offlineAuth) &&
                      _offlineSync.pendingCount > 0)
                    const SizedBox(height: 8),
                  if (_offlineSync.pendingCount > 0)
                    StudentInfoBanner(
                      message: _offlineSync.isSyncing
                          ? 'Syncing ${_offlineSync.pendingCount} pending attendance…'
                          : '${_offlineSync.pendingCount} offline attendance submission${_offlineSync.pendingCount == 1 ? '' : 's'} waiting to sync for staff review',
                      icon: _offlineSync.isSyncing
                          ? TablerIcons.refresh
                          : TablerIcons.cloudOff,
                      action: !_offlineSync.isSyncing
                          ? TextButton(
                              onPressed: offlineAuth
                                  ? _signInOnline
                                  : () => _offlineSync.syncPending(),
                              child: Text(
                                offlineAuth ? 'Sign in online' : 'Sync now',
                              ),
                            )
                          : null,
                    ),
                ],
              ),
            ),
          Expanded(
            child: AnimatedSwitcher(
              duration: reduceMotion
                  ? const Duration(milliseconds: 140)
                  : const Duration(milliseconds: 260),
              reverseDuration: reduceMotion
                  ? const Duration(milliseconds: 120)
                  : const Duration(milliseconds: 180),
              switchInCurve: Curves.easeOutCubic,
              switchOutCurve: Curves.easeInCubic,
              transitionBuilder: (child, animation) {
                final fade = CurvedAnimation(
                  parent: animation,
                  curve: Curves.easeOutCubic,
                );
                if (reduceMotion) {
                  return FadeTransition(opacity: fade, child: child);
                }
                return FadeTransition(
                  opacity: fade,
                  child: SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(0.018, 0),
                      end: Offset.zero,
                    ).animate(fade),
                    child: child,
                  ),
                );
              },
              child: KeyedSubtree(key: ValueKey(_index), child: pages[_index]),
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 8, 14, 8),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: NavigationBar(
              labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
              selectedIndex: _index < 2 ? _index : _index + 1,
              onDestinationSelected: (index) {
                switch (index) {
                  case 0:
                    setState(() => _index = 0);
                    break;
                  case 1:
                    setState(() => _index = 1);
                    break;
                  case 2:
                    context.push('/attendance/scan');
                    break;
                  case 3:
                    setState(() => _index = 2);
                    break;
                  case 4:
                    setState(() => _index = 3);
                    break;
                }
              },
              destinations: const [
                NavigationDestination(
                  icon: Icon(TablerIcons.home),
                  selectedIcon: Icon(TablerIcons.homeFilled),
                  label: 'Home',
                ),
                NavigationDestination(
                  icon: Icon(TablerIcons.calendarEvent),
                  selectedIcon: Icon(TablerIcons.calendarEventFilled),
                  label: 'Events',
                ),
                NavigationDestination(
                  icon: Icon(TablerIcons.scan),
                  label: 'Scan',
                ),
                NavigationDestination(
                  icon: Icon(TablerIcons.layoutGrid),
                  selectedIcon: Icon(TablerIcons.layoutGridFilled),
                  label: 'Bingo',
                ),
                NavigationDestination(
                  icon: Icon(TablerIcons.user),
                  selectedIcon: Icon(TablerIcons.userFilled),
                  label: 'Profile',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _signInOnline() async {
    await _auth.signOut();
    if (mounted) context.go('/login');
  }
}
