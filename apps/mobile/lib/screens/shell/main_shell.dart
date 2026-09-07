import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

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

const _shellBorder = Color(0xFFE2E8F0);

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

  @override
  void initState() {
    super.initState();
    _refreshUnread();
    _loadAccountStatus();
    _notifications.subscribeToNew(_refreshUnread);
    _offlineSync.addListener(_onOfflineChanged);
    _connectivity.addListener(_onOfflineChanged);
    _auth.addListener(_onOfflineChanged);
  }

  Future<void> _loadAccountStatus() async {
    final status = await _auth.fetchAccountStatus();
    if (mounted) setState(() => _accountStatus = status);
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

  @override
  Widget build(BuildContext context) {
    final pages = [
      HomeScreen(
        onScan: () => context.push('/attendance/scan'),
        onOpenBingo: () => setState(() => _index = 2),
      ),
      const EventsScreen(),
      const BingoScreen(),
      const ProfileScreen(),
    ];

    final offline = _connectivity.isOffline || _auth.isOfflineMode;

    return Scaffold(
      appBar: AppBar(
        title: const AppLogo(size: 36),
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: _shellBorder),
        ),
        actions: [
          IconButton(
            onPressed: () async {
              await context.push('/notifications');
              _refreshUnread();
            },
            icon: Badge(
              isLabelVisible: _unreadCount > 0,
              label: Text(_unreadCount > 9 ? '9+' : '$_unreadCount'),
              child: const Icon(Icons.notifications_outlined),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await AuthService.instance.signOut();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
      body: Column(
        children: [
          if (offline ||
              _accountStatus == 'pending' ||
              _offlineSync.pendingCount > 0)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: Column(
                children: [
                  if (offline)
                    StudentInfoBanner(
                      message: _auth.isOfflineMode
                          ? 'Offline mode — browsing cached data. Check-ins save on device and sync when you reconnect and sign in online.'
                          : 'No internet — showing cached data. Check-ins will sync when you reconnect.',
                      icon: Icons.wifi_off,
                      background: StudentUi.slateBg,
                      border: StudentUi.border,
                      foreground: StudentUi.muted,
                    ),
                  if (offline &&
                      (_accountStatus == 'pending' ||
                          _offlineSync.pendingCount > 0))
                    const SizedBox(height: 8),
                  if (_accountStatus == 'pending')
                    const StudentInfoBanner(
                      message:
                          'Your account is pending admin approval. You can browse the app, but check-in unlocks once approved.',
                      icon: Icons.hourglass_top,
                    ),
                  if (_accountStatus == 'pending' &&
                      _offlineSync.pendingCount > 0)
                    const SizedBox(height: 8),
                  if (_offlineSync.pendingCount > 0)
                    StudentInfoBanner(
                      message: _offlineSync.isSyncing
                          ? 'Syncing ${_offlineSync.pendingCount} pending attendance…'
                          : '${_offlineSync.pendingCount} attendance waiting to sync when online',
                      icon: _offlineSync.isSyncing
                          ? Icons.sync
                          : Icons.cloud_off,
                      action: (!_offlineSync.isSyncing && !_auth.isOfflineMode)
                          ? TextButton(
                              onPressed: () => _offlineSync.syncPending(),
                              child: const Text('Sync now'),
                            )
                          : null,
                    ),
                ],
              ),
            ),
          Expanded(child: pages[_index]),
        ],
      ),
      bottomNavigationBar: SizedBox(
        height: 78,
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.topCenter,
          children: [
            Container(
              height: 72,
              decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: _shellBorder))),
              child: Row(children: [
                Expanded(child: _NavItem(icon: Icons.home_outlined, activeIcon: Icons.home, label: 'Home', selected: _index == 0, onTap: () => setState(() => _index = 0))),
                Expanded(child: _NavItem(icon: Icons.event_outlined, activeIcon: Icons.event, label: 'Events', selected: _index == 1, onTap: () => setState(() => _index = 1))),
                const SizedBox(width: 72),
                Expanded(child: _NavItem(icon: Icons.grid_view_outlined, activeIcon: Icons.grid_view_rounded, label: 'Bingo', selected: _index == 2, onTap: () => setState(() => _index = 2))),
                Expanded(child: _NavItem(icon: Icons.person_outline, activeIcon: Icons.person, label: 'Profile', selected: _index == 3, onTap: () => setState(() => _index = 3))),
              ]),
            ),
            Positioned(
              top: -19,
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () => context.push('/attendance/scan'),
                  customBorder: const CircleBorder(),
                  child: Ink(
                    width: 64, height: 64,
                    decoration: const BoxDecoration(color: Color(0xFFC18A2E), shape: BoxShape.circle, boxShadow: [BoxShadow(color: Color(0x4017344D), blurRadius: 12, offset: Offset(0, 5))]),
                    child: const Icon(Icons.qr_code_scanner, color: Colors.white, size: 29),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _NavItem({required this.icon, required this.activeIcon, required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) => InkWell(onTap: onTap, child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(selected ? activeIcon : icon, size: 22, color: selected ? const Color(0xFF17324D) : StudentUi.muted), const SizedBox(height: 3), Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: selected ? const Color(0xFF17324D) : StudentUi.muted))]));
}
