const { withMainActivity } = require('@expo/config-plugins');

const HEALTH_CONNECT_ACTIONS = [
  'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE',
  'android.intent.action.VIEW_PERMISSION_USAGE',
];

function withHealthConnectPrivacyPolicy(config, { privacyPolicyUrl }) {
  return withMainActivity(config, config => {
    let source = config.modResults.contents;

    if (!source.includes('import android.content.Intent')) {
      source = source.replace(/^(package [^\n]+\n)/, '$1\nimport android.content.Intent\nimport android.net.Uri\n');
    } else if (!source.includes('import android.net.Uri')) {
      source = source.replace('import android.content.Intent', 'import android.content.Intent\nimport android.net.Uri');
    }

    if (!source.includes('openHealthConnectPrivacyPolicyIfRequested')) {
      // Generated template comments vary across Expo SDK releases. Match the
      // stable Kotlin onCreate call and activity method signature instead.
      const onCreateCall = /(\s*super\.onCreate\([^\n]*\);?)/;
      if (!onCreateCall.test(source)) {
        throw new Error('Could not add Health Connect privacy policy handling: MainActivity onCreate call was not found.');
      }
      source = source.replace(onCreateCall, '$1\n    if (openHealthConnectPrivacyPolicyIfRequested(intent)) {\n      finish()\n      return\n    }');

      const activityAnchor = /(\n\s*override fun getMainComponentName\s*\()/;
      if (!activityAnchor.test(source)) {
        throw new Error('Could not add Health Connect privacy policy handling: MainActivity lifecycle insertion point was not found.');
      }
      const actionCheck = HEALTH_CONNECT_ACTIONS.map(action => `action == "${action}"`).join(' || ');
      const helper = `\n  private fun openHealthConnectPrivacyPolicyIfRequested(launchIntent: Intent?): Boolean {\n    val action = launchIntent?.action\n    if (!(${actionCheck})) return false\n    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(${JSON.stringify(privacyPolicyUrl)})))\n    return true\n  }\n\n  override fun onNewIntent(intent: Intent) {\n    super.onNewIntent(intent)\n    setIntent(intent)\n    if (openHealthConnectPrivacyPolicyIfRequested(intent)) finish()\n  }\n`;
      source = source.replace(activityAnchor, `${helper}$1`);
    }

    config.modResults.contents = source;
    return config;
  });
}

module.exports = withHealthConnectPrivacyPolicy;