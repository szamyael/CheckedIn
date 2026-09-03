import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/student_terms.dart';
import '../../services/auth_service.dart';
import '../../services/onboarding_service.dart';
import '../../services/terms_service.dart';
import '../../widgets/app_logo.dart';
import '../../widgets/student_ui.dart';

/// Standalone terms screen for students who completed onboarding before accepting.
class TermsScreen extends StatefulWidget {
  const TermsScreen({super.key});

  @override
  State<TermsScreen> createState() => _TermsScreenState();
}

class _TermsScreenState extends State<TermsScreen> {
  bool _accepted = false;
  bool _submitting = false;

  Future<void> _submit() async {
    if (!_accepted || _submitting) return;
    setState(() => _submitting = true);
    await TermsService.instance.accept();
    if (!mounted) return;
    final auth = AuthService.instance;
    if (auth.isSignedIn) {
      context.go(auth.isEmailVerified ? '/home' : '/verify-email');
    } else {
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Row(
                children: [
                  const AppLogo(size: 28),
                  const Spacer(),
                  Text(
                    StudentTermsContent.lastUpdated,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            const Expanded(child: StudentTermsBody()),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  CheckboxListTile(
                    value: _accepted,
                    onChanged: _submitting
                        ? null
                        : (value) => setState(() => _accepted = value == true),
                    controlAffinity: ListTileControlAffinity.leading,
                    contentPadding: EdgeInsets.zero,
                    title: const Text(
                      'I have read and accept the Terms & Privacy Notice',
                      style: TextStyle(fontSize: 14),
                    ),
                  ),
                  const SizedBox(height: 8),
                  FilledButton(
                    onPressed: _accepted && !_submitting ? _submit : null,
                    child: Text(_submitting ? 'Saving…' : 'I accept and continue'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class StudentTermsBody extends StatelessWidget {
  const StudentTermsBody({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          StudentPageTitle(
            title: StudentTermsContent.title,
            subtitle: StudentTermsContent.intro,
          ),
          const SizedBox(height: 20),
          ...StudentTermsContent.sections.map(
            (section) => Padding(
              padding: const EdgeInsets.only(bottom: 20),
              child: _TermsSectionBlock(section: section),
            ),
          ),
        ],
      ),
    );
  }
}

class _TermsSectionBlock extends StatelessWidget {
  final StudentTermsSection section;

  const _TermsSectionBlock({required this.section});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          section.title,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
        ),
        ...section.paragraphs.map(
          (p) => Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(p, style: Theme.of(context).textTheme.bodySmall),
          ),
        ),
        ...section.bullets.map(
          (b) => Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('•  ', style: TextStyle(color: StudentUi.muted)),
                Expanded(
                  child: Text(b, style: Theme.of(context).textTheme.bodySmall),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

/// Terms acceptance step used at the end of onboarding.
class OnboardingTermsStep extends StatefulWidget {
  final ValueChanged<bool> onAcceptedChanged;

  const OnboardingTermsStep({super.key, required this.onAcceptedChanged});

  @override
  State<OnboardingTermsStep> createState() => _OnboardingTermsStepState();
}

class _OnboardingTermsStepState extends State<OnboardingTermsStep> {
  bool _accepted = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const Expanded(child: StudentTermsBody()),
        CheckboxListTile(
          value: _accepted,
          onChanged: (value) {
            setState(() => _accepted = value == true);
            widget.onAcceptedChanged(_accepted);
          },
          controlAffinity: ListTileControlAffinity.leading,
          contentPadding: const EdgeInsets.symmetric(horizontal: 24),
          title: const Text(
            'I have read and accept the Terms & Privacy Notice',
            style: TextStyle(fontSize: 14),
          ),
        ),
      ],
    );
  }
}

Future<void> completeOnboardingWithTerms() async {
  await TermsService.instance.accept();
  await OnboardingService.instance.markComplete();
}
