'use server';

import { revalidatePath } from 'next/cache'; // Import revalidatePath
import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { AIEmbedCustomizerService } from '@/features/creator/services/ai-embed-customizer';
import { EnhancedEmbedGeneratorService, type EmbedGenerationOptions, type GeneratedEmbed } from '@/features/creator/services/enhanced-embed-generator';
import type { ColorPalette } from '@/utils/color-palette-utils';
import { getBrandingStyles } from '@/utils/branding-utils';
import { generateAutoGradient } from '@/utils/gradient-utils';

import { getBrandingSuggestions, getOrCreateCreatorProfile, updateCreatorProfile } from '../controllers/creator-profile';
import { generateStripeOAuthLink } from '../controllers/stripe-connect';
import { createWhiteLabeledPage } from '../controllers/white-labeled-pages';
import type { CreatorProfile, CreatorProfileUpdate } from '../types';

export async function updateCreatorProfileAction(profileData: CreatorProfileUpdate) {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const updatedProfile = await updateCreatorProfile(user.id, profileData);

  // If onboarding is completed, revalidate relevant paths<dyad-problem-report summary="572 problems">
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="176" column="6" code="17008">JSX element 'div' has no corresponding closing tag.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="228" column="10" code="17008">JSX element 'div' has no corresponding closing tag.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="230" column="14" code="17008">JSX element 'div' has no corresponding closing tag.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="237" column="16" code="17008">JSX element 'div' has no corresponding closing tag.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="238" column="18" code="17008">JSX element 'div' has no corresponding closing tag.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="244" column="20" code="17008">JSX element 'DropdownMenu' has no corresponding closing tag.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="250" column="22" code="17008">JSX element 'DropdownMenuContent' has no corresponding closing tag.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="269" column="32" code="1003">Identifier expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="346" column="222" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="346" column="240" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="346" column="454" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="353" column="138" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="353" column="352" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="354" column="61" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="354" column="275" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="73" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="95" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="102" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="117" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="256" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="272" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="274" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="290" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="292" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="317" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="363" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="365" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="368" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="398" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="400" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="415" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="417" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="440" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="363" column="44" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="363" column="64" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="363" column="257" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="363" column="284" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="363" column="286" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="363" column="304" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="363" column="306" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="364" column="115" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="364" column="135" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="364" column="328" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="364" column="355" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="364" column="357" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="365" column="45" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="365" column="65" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="365" column="258" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="365" column="285" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="365" column="287" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="365" column="308" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="365" column="310" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="366" column="116" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="366" column="136" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="366" column="329" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="366" column="356" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="366" column="358" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="73" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="95" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="102" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="117" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="256" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="272" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="274" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="290" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="292" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="317" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="363" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="365" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="368" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="398" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="400" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="415" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="417" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="440" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="372" column="155" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="372" column="369" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="372" column="396" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="372" column="398" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="373" column="17" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="373" column="292" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="380" column="206" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="380" column="224" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="380" column="438" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="386" column="232" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="386" column="250" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="386" column="464" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="389" column="165" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="389" column="326" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="440" column="2" code="17008">JSX element 'dyad-write' has no corresponding closing tag.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="464" column="1" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="465" column="18" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="467" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="468" column="3" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="468" column="61" code="1003">Identifier expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="468" column="63" code="1382">Unexpected token. Did you mean `{'&gt;'}` or `&amp;gt;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="472" column="76" code="1003">Identifier expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="472" column="82" code="1382">Unexpected token. Did you mean `{'&gt;'}` or `&amp;gt;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="475" column="17" code="1382">Unexpected token. Did you mean `{'&gt;'}` or `&amp;gt;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="476" column="33" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="477" column="3" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="479" column="28" code="1382">Unexpected token. Did you mean `{'&gt;'}` or `&amp;gt;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="480" column="29" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="483" column="3" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="485" column="52" code="1382">Unexpected token. Did you mean `{'&gt;'}` or `&amp;gt;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="486" column="32" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="489" column="3" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="491" column="53" code="1382">Unexpected token. Did you mean `{'&gt;'}` or `&amp;gt;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="492" column="32" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="494" column="3" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="496" column="54" code="17008">JSX element 'HTMLFormElement' has no corresponding closing tag.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="496" column="73" code="1382">Unexpected token. Did you mean `{'&gt;'}` or `&amp;gt;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="497" column="27" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="502" column="9" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="509" column="5" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="512" column="11" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="514" column="73" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="515" column="28" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="515" column="62" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="516" column="7" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="517" column="73" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="518" column="28" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="518" column="62" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="519" column="7" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="522" column="5" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="523" column="54" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="524" column="22" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="524" column="96" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="525" column="5" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="526" column="29" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="527" column="5" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="528" column="3" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="530" column="61" code="1382">Unexpected token. Did you mean `{'&gt;'}` or `&amp;gt;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="531" column="5" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="532" column="7" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="533" column="5" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="536" column="7" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="537" column="11" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="541" column="47" code="1382">Unexpected token. Did you mean `{'&gt;'}` or `&amp;gt;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="542" column="46" code="1382">Unexpected token. Did you mean `{'&gt;'}` or `&amp;gt;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="544" column="7" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="547" column="26" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="547" column="61" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="548" column="5" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="549" column="57" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="550" column="22" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="550" column="81" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="551" column="5" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="552" column="29" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="553" column="5" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="554" column="3" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="556" column="97" code="1382">Unexpected token. Did you mean `{'&gt;'}` or `&amp;gt;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="557" column="5" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="557" column="44" code="1382">Unexpected token. Did you mean `{'&gt;'}` or `&amp;gt;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="559" column="3" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="561" column="63" code="1382">Unexpected token. Did you mean `{'&gt;'}` or `&amp;gt;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="562" column="5" code="1109">Expression expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="564" column="11" code="1005">'}' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="567" column="5" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="568" column="3" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="731" column="101" code="1005">'...' expected.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="736" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="736" column="2" code="1005">'&lt;/' expected.</problem>
<problem file="src/features/platform-owner/components/PlatformProductManager.tsx" line="291" column="101" code="1005">'...' expected.</problem>
<problem file="src/features/creator-onboarding/controllers/creator-profile.ts" line="127" column="5" code="2353">Object literal may only specify known properties, and 'page_slug' does not exist in type '{ billing_address?: Json | undefined; billing_email?: string | null | undefined; billing_phone?: string | null | undefined; brand_color?: string | null | undefined; brand_gradient?: Json | undefined; ... 18 more ...; updated_at?: string | undefined; }'.</problem>
<problem file="src/app/api/embed/checkout-session/route.ts" line="75" column="45" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/app/api/embed/checkout-session/route.ts" line="76" column="44" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/app/api/embed/creator/[creatorId]/route.ts" line="44" column="30" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/app/api/embed/header/[creatorId]/route.ts" line="48" column="30" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/app/api/embed/pricing/[creatorId]/route.ts" line="46" column="30" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/app/api/embed/trial/[creatorId]/[embedId]/route.ts" line="64" column="30" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/features/creator/controllers/email-service.ts" line="37" column="21" code="2352">Conversion of type '{ billing_address: Json; billing_email: string | null; billing_phone: string | null; brand_color: string | null; brand_gradient: Json; brand_pattern: Json; branding_extracted_at: string | null; ... 16 more ...; updated_at: string; }' to type 'CreatorProfile' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Property 'page_slug' is missing in type '{ billing_address: Json; billing_email: string | null; billing_phone: string | null; brand_color: string | null; brand_gradient: Json; brand_pattern: Json; branding_extracted_at: string | null; ... 16 more ...; updated_at: string; }' but required in type 'CreatorProfile'.</problem>
<problem file="src/features/creator/controllers/handle-creator-checkout.ts" line="50" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;asset_sharing_logs&quot; | &quot;embed_assets&quot; | &quot;creator_analytics&quot; | &quot;creator_profiles&quot; | &quot;creator_products&quot; | &quot;creator_webhooks&quot; | &quot;customers&quot; | &quot;platform_settings&quot; | &quot;prices&quot; | &quot;products&quot; | &quot;subscriptions&quot; | &quot;users&quot; | &quot;white_labeled_pages&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;subscribed_products&quot;' is not assignable to parameter of type '&quot;asset_sharing_logs&quot; | &quot;embed_assets&quot; | &quot;creator_analytics&quot; | &quot;creator_profiles&quot; | &quot;creator_products&quot; | &quot;creator_webhooks&quot; | &quot;customers&quot; | &quot;platform_settings&quot; | &quot;prices&quot; | &quot;products&quot; | &quot;subscriptions&quot; | &quot;users&quot; | &quot;white_labeled_pages&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ Tables: { asset_sharing_logs: { Row: { accessed_at: string; accessed_by_ip: string | null; accessed_by_user_agent: string | null; asset_id: string; id: string; referrer_url: string | null; }; Insert: { ...; }; Update: { ...; }; Relationships: [...]; }; ... 11 more ...; white_labeled_pages: { ...; }; }; Views: {}; Functions: { ...; }; Enums: { ...; }; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;subscribed_products&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/features/creator/controllers/handle-creator-checkout.ts" line="52" column="11" code="2769">No overload matches this call.
  Overload 1 of 2, '(values: { accessed_at?: string | undefined; accessed_by_ip?: string | null | undefined; accessed_by_user_agent?: string | null | undefined; asset_id: string; id?: string | undefined; referrer_url?: string | ... 1 more ... | undefined; } | ... 11 more ... | { ...; }, options?: { ...; } | undefined): PostgrestFilterBuilder&lt;...&gt;', gave the following error.
    Object literal may only specify known properties, and 'subscription_id' does not exist in type '{ accessed_at?: string | undefined; accessed_by_ip?: string | null | undefined; accessed_by_user_agent?: string | null | undefined; asset_id: string; id?: string | undefined; referrer_url?: string | ... 1 more ... | undefined; } | ... 11 more ... | { ...; }'.
  Overload 2 of 2, '(values: ({ accessed_at?: string | undefined; accessed_by_ip?: string | null | undefined; accessed_by_user_agent?: string | null | undefined; asset_id: string; id?: string | undefined; referrer_url?: string | ... 1 more ... | undefined; } | ... 11 more ... | { ...; })[], options?: { ...; } | undefined): PostgrestFilterBuilder&lt;...&gt;', gave the following error.
    Object literal may only specify known properties, and 'subscription_id' does not exist in type '({ accessed_at?: string | undefined; accessed_by_ip?: string | null | undefined; accessed_by_user_agent?: string | null | undefined; asset_id: string; id?: string | undefined; referrer_url?: string | ... 1 more ... | undefined; } | ... 11 more ... | { ...; })[]'.</problem>
<problem file="src/features/creator/controllers/get-subscriber-product-details.ts" line="12" column="11" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;creator_profiles&quot; | &quot;asset_sharing_logs&quot; | &quot;embed_assets&quot; | &quot;creator_analytics&quot; | &quot;creator_products&quot; | &quot;creator_webhooks&quot; | &quot;customers&quot; | &quot;platform_settings&quot; | &quot;prices&quot; | &quot;products&quot; | &quot;subscriptions&quot; | &quot;users&quot; | &quot;white_labeled_pages&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;subscribed_products&quot;' is not assignable to parameter of type '&quot;creator_profiles&quot; | &quot;asset_sharing_logs&quot; | &quot;embed_assets&quot; | &quot;creator_analytics&quot; | &quot;creator_products&quot; | &quot;creator_webhooks&quot; | &quot;customers&quot; | &quot;platform_settings&quot; | &quot;prices&quot; | &quot;products&quot; | &quot;subscriptions&quot; | &quot;users&quot; | &quot;white_labeled_pages&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ Tables: { asset_sharing_logs: { Row: { accessed_at: string; accessed_by_ip: string | null; accessed_by_user_agent: string | null; asset_id: string; id: string; referrer_url: string | null; }; Insert: { ...; }; Update: { ...; }; Relationships: [...]; }; ... 11 more ...; white_labeled_pages: { ...; }; }; Views: {}; Functions: { ...; }; Enums: { ...; }; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;subscribed_products&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/features/creator/controllers/get-subscriber-product-details.ts" line="25" column="10" code="2352">Conversion of type '{ billing_address: Json; billing_email: string | null; billing_phone: string | null; brand_color: string | null; brand_gradient: Json; brand_pattern: Json; branding_extracted_at: string | null; ... 16 more ...; updated_at: string; } | ... 11 more ... | { ...; }' to type 'SubscribedProduct' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type '{ active: boolean | null; created_at: string; creator_id: string; custom_css: string | null; id: string; meta_description: string | null; meta_title: string | null; page_config: Json; page_description: string | null; page_slug: string; page_title: string | null; updated_at: string; }' is missing the following properties from type 'SubscribedProduct': subscription_id, creator_product_id, name, description, and 7 more.</problem>
<problem file="src/features/creator-onboarding/actions/onboarding-actions.ts" line="29" column="41" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/features/creator-onboarding/actions/onboarding-actions.ts" line="30" column="41" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/features/creator-onboarding/actions/onboarding-actions.ts" line="179" column="5" code="2741">Property 'page_slug' is missing in type 'import(&quot;/Users/randy/dyad-apps/Staryer/src/features/creator-onboarding/types/index&quot;).CreatorProfile' but required in type 'import(&quot;/Users/randy/dyad-apps/Staryer/src/features/creator/types/index&quot;).CreatorProfile'.</problem>
<problem file="src/app/creator/(protected)/dashboard/page.tsx" line="30" column="57" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="269" column="25" code="2322">Type 'boolean' is not assignable to type 'MouseEventHandler&lt;HTMLDivElement&gt;'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="269" column="32" code="2339">Property 'dyad-problem-report' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="270" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="270" column="134" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="271" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="271" column="112" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="272" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="272" column="113" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="273" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="273" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="274" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="274" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="275" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="275" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="276" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="276" column="112" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="277" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="277" column="112" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="278" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="278" column="113" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="279" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="279" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="280" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="280" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="281" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="281" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="282" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="282" column="112" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="283" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="283" column="112" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="284" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="284" column="113" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="285" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="285" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="286" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="286" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="287" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="287" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="288" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="288" column="113" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="289" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="289" column="112" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="290" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="290" column="113" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="291" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="291" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="292" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="292" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="293" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="293" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="294" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="294" column="112" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="295" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="295" column="112" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="296" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="296" column="113" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="297" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="297" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="298" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="298" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="299" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="299" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="300" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="300" column="112" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="301" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="301" column="112" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="302" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="302" column="113" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="303" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="303" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="304" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="304" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="305" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="305" column="143" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="306" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="306" column="112" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="307" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="307" column="113" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="308" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="308" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="309" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="309" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="310" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="310" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="311" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="311" column="112" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="312" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="312" column="112" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="313" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="313" column="113" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="314" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="314" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="315" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="315" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="316" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="316" column="112" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="317" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="317" column="112" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="318" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="318" column="113" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="319" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="319" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="320" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="320" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="321" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="321" column="112" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="322" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="322" column="112" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="323" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="323" column="113" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="324" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="324" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="325" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="325" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="326" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="326" column="112" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="327" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="327" column="113" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="328" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="328" column="114" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="329" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="329" column="93" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="330" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="330" column="93" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="331" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="331" column="113" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="332" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="332" column="113" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="333" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="333" column="114" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="334" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="334" column="93" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="335" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="335" column="93" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="336" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="336" column="100" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="337" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="337" column="93" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="338" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="338" column="113" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="339" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="339" column="113" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="340" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="340" column="114" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="341" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="341" column="93" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="342" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="342" column="93" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="343" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="343" column="93" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="344" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="344" column="113" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="345" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="345" column="92" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="346" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="346" column="206" code="2304">Cannot find name 'billing_address'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="346" column="224" code="2304">Cannot find name 'Json'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="346" column="231" code="18050">The value 'undefined' cannot be used here.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="346" column="457" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="347" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="347" column="156" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="348" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="348" column="156" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="349" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="349" column="159" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="350" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="350" column="158" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="351" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="351" column="159" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="352" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="352" column="167" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="353" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="353" column="123" code="2304">Cannot find name 'billing_address'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="354" column="46" code="2304">Cannot find name 'billing_address'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="354" column="316" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="355" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="355" column="166" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="356" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="356" column="166" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="357" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="67" code="2304">Cannot find name 'Tables'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="77" code="2304">Cannot find name 'asset_sharing_logs'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="99" code="2304">Cannot find name 'Row'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="106" code="2304">Cannot find name 'accessed_at'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="267" code="2609">JSX spread child must be an array type.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="285" code="2609">JSX spread child must be an array type.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="358" code="2609">JSX spread child must be an array type.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="393" code="2609">JSX spread child must be an array type.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="360" column="410" code="2609">JSX spread child must be an array type.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="361" column="103" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="362" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="363" column="32" code="2304">Cannot find name 'accessed_at'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="363" column="46" code="2693">'string' only refers to a type, but is being used as a value here.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="363" column="55" code="18050">The value 'undefined' cannot be used here.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="363" column="279" code="2609">JSX spread child must be an array type.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="363" column="299" code="2609">JSX spread child must be an array type.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="364" column="103" code="2304">Cannot find name 'accessed_at'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="364" column="117" code="2693">'string' only refers to a type, but is being used as a value here.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="364" column="126" code="18050">The value 'undefined' cannot be used here.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="364" column="350" code="2609">JSX spread child must be an array type.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="365" column="33" code="2304">Cannot find name 'accessed_at'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="365" column="47" code="2693">'string' only refers to a type, but is being used as a value here.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="365" column="56" code="18050">The value 'undefined' cannot be used here.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="365" column="280" code="2609">JSX spread child must be an array type.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="365" column="303" code="2609">JSX spread child must be an array type.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="366" column="104" code="2304">Cannot find name 'accessed_at'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="366" column="118" code="2693">'string' only refers to a type, but is being used as a value here.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="366" column="127" code="18050">The value 'undefined' cannot be used here.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="366" column="351" code="2609">JSX spread child must be an array type.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="366" column="364" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="367" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="67" code="2304">Cannot find name 'Tables'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="77" code="2304">Cannot find name 'asset_sharing_logs'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="99" code="2304">Cannot find name 'Row'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="106" code="2304">Cannot find name 'accessed_at'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="267" code="2609">JSX spread child must be an array type.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="285" code="2609">JSX spread child must be an array type.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="358" code="2609">JSX spread child must be an array type.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="393" code="2609">JSX spread child must be an array type.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="370" column="410" code="2609">JSX spread child must be an array type.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="371" column="103" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="372" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="372" column="140" code="2304">Cannot find name 'billing_address'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="372" column="391" code="2609">JSX spread child must be an array type.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="373" column="11" code="2304">Cannot find name 'active'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="373" column="429" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="374" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="374" column="174" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="375" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="375" column="174" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="376" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="376" column="387" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="377" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="377" column="159" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="378" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="378" column="380" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="379" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="379" column="160" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="380" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="380" column="190" code="2304">Cannot find name 'billing_address'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="380" column="208" code="2304">Cannot find name 'Json'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="380" column="215" code="18050">The value 'undefined' cannot be used here.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="380" column="441" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="381" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="381" column="126" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="382" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="382" column="180" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="383" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="383" column="176" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="384" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="384" column="185" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="385" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="385" column="162" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="386" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="386" column="216" code="2304">Cannot find name 'billing_address'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="386" column="234" code="2304">Cannot find name 'Json'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="386" column="241" code="18050">The value 'undefined' cannot be used here.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="386" column="467" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="387" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="387" column="163" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="388" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="388" column="151" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="389" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="389" column="159" code="2304">Cannot find name 'isOpen'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="389" column="373" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="390" column="1" code="2339">Property 'dyad-problem-report' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="390" column="23" code="2339">Property 'think' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="426" column="1" code="2339">Property 'think' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="440" column="1" code="2339">Property 'dyad-write' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="443" column="10" code="2304">Cannot find name 'useEffect'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="443" column="10" code="2695">Left side of comma operator is unused and has no side effects.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="446" column="10" code="2304">Cannot find name 'AlertTriangle'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="446" column="10" code="2695">Left side of comma operator is unused and has no side effects.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="446" column="10" code="2695">Left side of comma operator is unused and has no side effects.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="446" column="10" code="2695">Left side of comma operator is unused and has no side effects.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="446" column="10" code="2695">Left side of comma operator is unused and has no side effects.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="446" column="10" code="2695">Left side of comma operator is unused and has no side effects.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="446" column="10" code="2695">Left side of comma operator is unused and has no side effects.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="446" column="25" code="2304">Cannot find name 'CheckCircle'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="446" column="38" code="2304">Cannot find name 'Code'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="449" column="10" code="2695">Left side of comma operator is unused and has no side effects.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="449" column="10" code="2695">Left side of comma operator is unused and has no side effects.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="449" column="10" code="2695">Left side of comma operator is unused and has no side effects.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="449" column="10" code="2695">Left side of comma operator is unused and has no side effects.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="449" column="10" code="2695">Left side of comma operator is unused and has no side effects.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="449" column="10" code="2695">Left side of comma operator is unused and has no side effects.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="449" column="52" code="2304">Cannot find name 'DialogFooter'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="452" column="10" code="2304">Cannot find name 'Switch'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="453" column="10" code="2304">Cannot find name 'Textarea'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="455" column="10" code="2304">Cannot find name 'EmbedCodeDialog'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="456" column="10" code="2304">Cannot find name 'PlatformSettings'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="457" column="10" code="2304">Cannot find name 'ProductWithPrices'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="459" column="10" code="2304">Cannot find name 'createPlatformProductAction'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="459" column="10" code="2695">Left side of comma operator is unused and has no side effects.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="459" column="39" code="2304">Cannot find name 'updatePlatformProductAction'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="462" column="3" code="2304">Cannot find name 'initialProducts'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="462" column="3" code="2695">Left side of comma operator is unused and has no side effects.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="462" column="3" code="2695">Left side of comma operator is unused and has no side effects.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="463" column="3" code="2304">Cannot find name 'settings'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="465" column="3" code="2304">Cannot find name 'initialProducts'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="468" column="44" code="2304">Cannot find name 'ProductWithPrices'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="472" column="58" code="2304">Cannot find name 'ProductWithPrices'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="476" column="5" code="2304">Cannot find name 'setProducts'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="476" column="17" code="2304">Cannot find name 'initialProducts'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="480" column="5" code="2304">Cannot find name 'setSelectedProduct'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="486" column="5" code="2304">Cannot find name 'setSelectedProduct'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="486" column="24" code="2304">Cannot find name 'product'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="492" column="5" code="2304">Cannot find name 'setSelectedProduct'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="492" column="24" code="2304">Cannot find name 'product'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="496" column="54" code="2786">'HTMLFormElement' cannot be used as a JSX component.
  Its type '{ new (): HTMLFormElement; prototype: HTMLFormElement; }' is not a valid JSX element type.
    Type '{ new (): HTMLFormElement; prototype: HTMLFormElement; }' is not assignable to type 'new (props: any, deprecatedLegacyContext?: any) =&gt; Component&lt;any, any, any&gt;'.
      Type 'HTMLFormElement' is missing the following properties from type 'Component&lt;any, any, any&gt;': context, setState, forceUpdate, render, and 3 more.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="497" column="5" code="18048">'event' is possibly 'undefined'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="502" column="7" code="2304">Cannot find name 'id'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="512" column="7" code="2304">Cannot find name 'let'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="514" column="9" code="2304">Cannot find name 'updatedProducts'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="514" column="33" code="2304">Cannot find name 'updatePlatformProductAction'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="514" column="61" code="2304">Cannot find name 'productData'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="515" column="17" code="2304">Cannot find name 'description'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="517" column="9" code="2304">Cannot find name 'updatedProducts'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="517" column="33" code="2304">Cannot find name 'createPlatformProductAction'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="517" column="61" code="2304">Cannot find name 'productData'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="518" column="17" code="2304">Cannot find name 'description'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="523" column="48" code="2304">Cannot find name 'error'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="524" column="15" code="2304">Cannot find name 'variant'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="526" column="7" code="2304">Cannot find name 'setIsSubmitting'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="531" column="55" code="2304">Cannot find name 'product'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="537" column="9" code="2304">Cannot find name 'id'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="547" column="15" code="2304">Cannot find name 'description'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="549" column="51" code="2304">Cannot find name 'error'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="550" column="15" code="2304">Cannot find name 'variant'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="552" column="7" code="2304">Cannot find name 'setIsSubmitting'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="564" column="7" code="2304">Cannot find name 'year'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="574" column="10" code="2304">Cannot find name 'settings'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="576" column="14" code="2304">Cannot find name 'CheckCircle'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="580" column="58" code="2304">Cannot find name 'settings'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="586" column="14" code="2304">Cannot find name 'AlertTriangle'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="591" column="18" code="2304">Cannot find name 'Link'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="593" column="19" code="2304">Cannot find name 'Link'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="602" column="26" code="2304">Cannot find name 'handleAddNew'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="602" column="51" code="2304">Cannot find name 'settings'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="611" column="12" code="2304">Cannot find name 'products'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="611" column="26" code="7006">Parameter 'product' implicitly has an 'any' type.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="616" column="21" code="2607">JSX element class does not support attributes because it does not have a 'props' property.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="616" column="22" code="2786">'Image' cannot be used as a JSX component.
  Its type 'new (width?: number | undefined, height?: number | undefined) =&gt; HTMLImageElement' is not a valid JSX element type.
    Type 'new (width?: number | undefined, height?: number | undefined) =&gt; HTMLImageElement' is not assignable to type 'new (props: any, deprecatedLegacyContext?: any) =&gt; Component&lt;any, any, any&gt;'.
      Type 'HTMLImageElement' is missing the following properties from type 'Component&lt;any, any, any&gt;': context, setState, forceUpdate, render, and 3 more.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="628" column="68" code="2304">Cannot find name 'handleEmbed'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="628" column="91" code="2304">Cannot find name 'Code'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="629" column="68" code="2304">Cannot find name 'handleEdit'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="631" column="70" code="2304">Cannot find name 'handleArchive'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="638" column="39" code="7006">Parameter 'price' implicitly has an 'any' type.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="649" column="75" code="2304">Cannot find name 'formatDate'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="664" column="21" code="2304">Cannot find name 'isFormDialogOpen'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="664" column="53" code="2304">Cannot find name 'setIsFormDialogOpen'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="667" column="27" code="2304">Cannot find name 'selectedProduct'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="669" column="16" code="2304">Cannot find name 'selectedProduct'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="672" column="27" code="2304">Cannot find name 'handleSubmit'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="676" column="60" code="2304">Cannot find name 'selectedProduct'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="681" column="18" code="2304">Cannot find name 'Textarea'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="681" column="77" code="2304">Cannot find name 'selectedProduct'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="686" column="88" code="2304">Cannot find name 'selectedProduct'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="695" column="112" code="2304">Cannot find name 'getPriceDefaultValue'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="695" column="133" code="2304">Cannot find name 'selectedProduct'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="699" column="110" code="2304">Cannot find name 'getPriceDefaultValue'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="699" column="131" code="2304">Cannot find name 'selectedProduct'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="703" column="14" code="2304">Cannot find name 'selectedProduct'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="707" column="20" code="2304">Cannot find name 'Switch'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="707" column="55" code="2304">Cannot find name 'isActive'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="707" column="82" code="2304">Cannot find name 'setIsActive'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="708" column="46" code="2304">Cannot find name 'isActive'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="712" column="14" code="2304">Cannot find name 'DialogFooter'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="713" column="70" code="2304">Cannot find name 'setIsFormDialogOpen'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="714" column="47" code="2304">Cannot find name 'isSubmitting'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="715" column="18" code="2304">Cannot find name 'isSubmitting'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="715" column="47" code="2304">Cannot find name 'selectedProduct'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="717" column="15" code="2304">Cannot find name 'DialogFooter'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="723" column="8" code="2304">Cannot find name 'selectedProduct'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="723" column="27" code="2304">Cannot find name 'settings'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="724" column="10" code="2304">Cannot find name 'EmbedCodeDialog'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="725" column="19" code="2304">Cannot find name 'isEmbedDialogOpen'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="726" column="25" code="2304">Cannot find name 'setIsEmbedDialogOpen'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="727" column="24" code="2304">Cannot find name 'selectedProduct'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="728" column="22" code="2304">Cannot find name 'selectedProduct'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="729" column="22" code="2304">Cannot find name 'settings'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="730" column="26" code="2304">Cannot find name 'selectedProduct'.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="730" column="54" code="7006">Parameter 'p' implicitly has an 'any' type.</problem>
<problem file="src/features/creator/components/AssetLibraryManager.tsx" line="731" column="28" code="2304">Cannot find name 'settings'.</problem>
<problem file="src/app/creator/(protected)/dashboard/products/page.tsx" line="35" column="9" code="2741">Property 'page_slug' is missing in type 'import(&quot;/Users/randy/dyad-apps/Staryer/src/features/creator-onboarding/types/index&quot;).CreatorProfile' but required in type 'import(&quot;/Users/randy/dyad-apps/Staryer/src/features/creator/types/index&quot;).CreatorProfile'.</problem>
<problem file="src/features/creator/components/ProfileForm.tsx" line="33" column="59" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/features/creator/components/ProfileForm.tsx" line="67" column="9" code="2353">Object literal may only specify known properties, and 'page_slug' does not exist in type '{ billing_address?: Json | undefined; billing_email?: string | null | undefined; billing_phone?: string | null | undefined; brand_color?: string | null | undefined; brand_gradient?: Json | undefined; ... 18 more ...; updated_at?: string | undefined; }'.</problem>
<problem file="src/features/creator-onboarding/components/steps/CompletionStep.tsx" line="22" column="50" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/features/creator-onboarding/components/steps/ReviewStep.tsx" line="82" column="50" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/features/creator-onboarding/components/steps/WhiteLabelSetupStep.tsx" line="57" column="52" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/features/creator-onboarding/components/steps/WhiteLabelSetupStep.tsx" line="158" column="9" code="2353">Object literal may only specify known properties, and 'page_slug' does not exist in type '{ billing_address?: Json | undefined; billing_email?: string | null | undefined; billing_phone?: string | null | undefined; brand_color?: string | null | undefined; brand_gradient?: Json | undefined; ... 18 more ...; updated_at?: string | undefined; }'.</problem>
<problem file="src/features/creator/components/CreatorProductManager.tsx" line="237" column="10" code="2741">Property 'creatorPageSlug' is missing in type '{ isOpen: boolean; onOpenChange: Dispatch&lt;SetStateAction&lt;boolean&gt;&gt;; productName: string; productId: string; creatorId: string; stripePriceId: string | null; }' but required in type 'EmbedCodeDialogProps'.</problem>
</dyad-problem-report>You're facing a large number of TypeScript errors, but many of them are related to a few core issues. Let's break them down and fix them systematically.

Here's the plan:

1.  **`src/public/static/embed.js` errors (2-76)**: These are TypeScript syntax errors in a file that should be plain JavaScript. I will remove all TypeScript-specific syntax (type annotations, `as const`) from this file.
2.  **JSX Closing Tags (1-7)**: There are several JSX elements missing closing tags in `src/features/creator/components/AssetLibraryManager.tsx`. I will add the missing closing tags.
3.  **`onClick` Type Mismatch (8, 181, 182)**: The `onClick` prop in `DropdownMenuItem` expects a function, but it's receiving a boolean or an unexpected type. I will ensure it receives a proper event handler function.
4.  **`dyad-problem-report` and `problem` JSX elements (9-79, 183-447)**: These are not valid JSX elements and are likely artifacts from a previous error reporting mechanism. I will remove these lines.
5.  **`CreatorProfile` `page_slug` property (80-83, 91-95, 99-101, 103, 105, 166-172, 177-180, 566-571)**: The `CreatorProfile` type is missing the `page_slug` property in many files. This indicates that the Supabase types (`src/libs/supabase/types.ts`) are still out of sync with the database schema after the `custom_domain` to `page_slug` migration. This will be resolved by regenerating your Supabase types.
6.  **`Object literal may only specify known properties, and 'page_slug' does not exist...` (77, 97, 103, 165, 567, 571)**: This is a direct consequence of the `CreatorProfile` type being outdated. Regenerating types will fix this.
7.  **`Property 'custom_domain' does not exist on type 'CreatorProfile'` (85, 86, 173, 174)**: These are remnants of the old `custom_domain` field. I will update these references to `page_slug`.
8.  **`No overload matches this call. Argument of type '"subscribed_products"' is not assignable...` (87, 89, 175, 176)**: This confirms that `src/libs/supabase/types.ts` is not updated with the `subscribed_products` table. Regenerating types will fix this.
9.  **`Cannot find name 'getURL'.` (98, 105, 568, 569)**: The `getURL` utility function is not imported in `src/features/creator/components/ProfileForm.tsx` and `src/features/creator-onboarding/components/steps/WhiteLabelSetupStep.tsx`. I will add the necessary import statements.
10. **`Cannot find name 'handleApplyPalette'.` (102, 104)**: In `src/features/creator-onboarding/components/steps/WhiteLabelSetupStep.tsx`, `handleApplyPalette` is called but not defined within the component's scope. I will define this function within `WhiteLabelSetupStep` and ensure it correctly updates the component's state and calls the `applyColorPaletteAction`.
11. **`Property 'creatorPageSlug' is missing...` (106, 572)**: In `src/features/platform-owner/components/PlatformProductManager.tsx`, the `EmbedCodeDialog` component is missing the `creatorPageSlug` prop. I will pass `settings.owner_id` as the `creatorPageSlug` for platform-level embeds.
12. **Missing Imports and Type Issues in `PlatformProductManager.tsx` (90-163, 449-564)**: These are a cascade of missing imports, incorrect type usage, and syntax errors in `PlatformProductManager.tsx`. I will add all necessary imports, correct the `useState` and `useEffect` hooks, and fix the JSX and variable references.

Here are the code modifications:

<dyad-write path="src/features/platform-owner/components/PlatformProductManager.tsx" description="Updating PlatformProductManager to pass creatorPageSlug to EmbedCodeDialog and fixing numerous syntax and import errors.">
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, Archive, Calendar, CheckCircle, Code, Edit, Package, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { EmbedCodeDialog } from '@/features/creator/components/EmbedCodeDialog';
import { PlatformSettings } from '@/features/platform-owner-onboarding/types';
import { ProductWithPrices } from '@/features/pricing/types';

import { createPlatformProductAction, updatePlatformProductAction } from '../actions/product-actions';

interface PlatformProductManagerProps {
  initialProducts: ProductWithPrices[];
  settings: PlatformSettings;
}

export function PlatformProductManager({
  initialProducts,
  settings,
}: PlatformProductManagerProps) {
  const [products, setProducts] = useState<ProductWithPrices[]>(initialProducts);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isEmbedDialogOpen, setIsEmbedDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithPrices | null>(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const handleAddNew = () => {
    setSelectedProduct(null);
    setIsActive(true);
    setIsFormDialogOpen(true);
  };

  const handleEdit = (product: ProductWithPrices) => {
    setSelectedProduct(product);
    setIsActive(product.active ?? true);
    setIsFormDialogOpen(true);
  };

  const handleEmbed = (product: ProductWithPrices) => {
    setSelectedProduct(product);
    setIsEmbedDialogOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const productData = {
      id: selectedProduct?.id,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      image: formData.get('image') as string,
      monthlyPrice: parseFloat(formData.get('monthlyPrice') as string),
      yearlyPrice: parseFloat(formData.get('yearlyPrice') as string),
      active: isActive,
    };

    try {
      let updatedProducts;
      if (selectedProduct) {
        updatedProducts = await updatePlatformProductAction(productData);
        toast({ description: 'Product updated successfully.' });
      } else {
        updatedProducts = await createPlatformProductAction(productData);
        toast({ description: 'Product created successfully.' });
      }
      setProducts(updatedProducts);
      setIsFormDialogOpen(false);
    } catch (error) {
      console.error('Failed to save product:', error);
      toast({ variant: 'destructive', description: 'Failed to save product. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (product: ProductWithPrices) => {
    if (!confirm(`Are you sure you want to archive "${product.name}"? This will make it unavailable for new subscriptions.`)) {
      return;
    }
    setIsSubmitting(true);
    try {
      const productData = {
        id: product.id,
        name: product.name || '',
        description: product.description || '',
        image: product.image || '',
        monthlyPrice: (product.prices.find(p => p.interval === 'month')?.unit_amount ?? 0) / 100,
        yearlyPrice: (product.prices.find(p => p.interval === 'year')?.unit_amount ?? 0) / 100,
        active: false,
      };
      const updatedProducts = await updatePlatformProductAction(productData);
      setProducts(updatedProducts);
      toast({ description: 'Product archived successfully.' });
    } catch (error) {
      console.error('Failed to archive product:', error);
      toast({ variant: 'destructive', description: 'Failed to archive product.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriceDefaultValue = (product: ProductWithPrices | null, interval: 'month' | 'year') => {
    const amount = product?.prices.find(p => p.interval === interval)?.unit_amount;
    return amount ? amount / 100 : '';
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      {/* Connection Status & Header */}
      <div className="mb-6">
        {settings.stripe_account_enabled ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="font-medium text-green-800">Stripe Account Connected</h4>
              <p className="text-sm text-green-700">
                Account ID: <span className="font-mono">{settings.stripe_account_id}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <h4 className="font-medium text-red-800">Stripe Account Not Connected</h4>
              <p className="text-sm text-red-700">
                You must connect your Stripe account to create products and accept payments.
                <Link href="/platform-owner-onboarding" className="ml-2 font-semibold underline hover:no-underline">
                  Connect Stripe Now
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Platform Products</h1>
        <Button onClick={handleAddNew} disabled={!settings.stripe_account_enabled}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Product
        </Button>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="divide-y divide-gray-200">
          {products.map((product) => (
            <div key={product.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  {product.image ? (
                    <Image src={product.image} alt={product.name || ''} width={40} height={40} className="rounded-md object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEmbed(product)}><Code className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}><Edit className="h-4 w-4" /></Button>
                  {product.active && (
                    <Button variant="ghost" size="sm" onClick={() => handleArchive(product)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                  )}
                </div>
              </div>
              <div className="mt-4 pl-14">
                <h4 className="text-sm font-medium text-gray-800 mb-2">Prices</h4>
                <div className="space-y-2">
                  {product.prices.map(price => (
                    <div key={price.id} className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${price.active ? 'text-green-600' : 'text-red-600'}`}>
                            {price.active ? 'Active' : 'Archived'}
                          </span>
                          <span className="font-semibold text-gray-900">
                            ${(price.unit_amount ?? 0) / 100} / {price.interval}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">Created: {formatDate(price.created_at)}</span>
                      </div>
                      <div className="mt-2">
                        <code className="text-xs text-gray-500 bg-gray-200 px-1 py-0.5 rounded">ID: {price.id}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit/Add Product Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? 'Edit Product' : 'Add a new product'}</DialogTitle>
            <DialogDescription>
              {selectedProduct ? 'Update the details for this subscription plan.' : 'Create a new subscription plan to offer your creators.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name (required)</Label>
                <Input id="name" name="name" defaultValue={selectedProduct?.name || ''} required />
                <p className="text-xs text-gray-500 mt-1">Name of the product or service, visible to customers.</p>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={selectedProduct?.description || ''} />
                <p className="text-xs text-gray-500 mt-1">Appears at checkout, on the customer portal, and in quotes.</p>
              </div>
              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input id="image" name="image" placeholder="https://..." defaultValue={selectedProduct?.image || ''} />
                <p className="text-xs text-gray-500 mt-1">Appears at checkout. Must be a public URL.</p>
              </div>
            </div>
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium">Pricing</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monthlyPrice">Monthly Price (USD)</Label>
                  <Input id="monthlyPrice" name="monthlyPrice" type="number" step="0.01" min="0" defaultValue={getPriceDefaultValue(selectedProduct, 'month')} required />
                </div>
                <div>
                  <Label htmlFor="yearlyPrice">Yearly Price (USD)</Label>
                  <Input id="yearlyPrice" name="yearlyPrice" type="number" step="0.01" min="0" defaultValue={getPriceDefaultValue(selectedProduct, 'year')} required />
                </div>
              </div>
            </div>
            {selectedProduct && (
              <div className="flex items-center justify-between border-t pt-4">
                <Label htmlFor="active-status">Product Status</Label>
                <div className="flex items-center gap-2">
                  <Switch id="active-status" checked={isActive} onCheckedChange={setIsActive} />
                  <span className="text-sm">{isActive ? 'Active' : 'Archived'}</span>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : selectedProduct ? 'Save Changes' : 'Add Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Embed Code Dialog */}
      {selectedProduct && settings.owner_id && (
        <EmbedCodeDialog
          isOpen={isEmbedDialogOpen}
          onOpenChange={setIsEmbedDialogOpen}
          productName={selectedProduct.name || 'Product'}
          productId={selectedProduct.id}
          creatorId={settings.owner_id}
          stripePriceId={selectedProduct.prices.find(p => p.interval === 'month')?.id || null}
          creatorPageSlug={settings.owner_id} {/* Assuming platform owner's page slug is their ID */}
        />
      )}
    </div>
  );
}