import { cn } from "@/lib/utils";
import * as React from "react";
import { Input } from "./input";

const COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 +91 (India)", length: 10 },
  { code: "+1", label: "🇺🇸 +1 (United States)", length: 8 },
  { code: "+1", label: "🇨🇦 +1 (Canada)", length: 10 },
  { code: "+376", label: "🇦🇩 +376 (Andorra)", length: 10 },
  { code: "+971", label: "🇦🇪 +971 (United Arab Emirates)", length: 9 },
  { code: "+93", label: "🇦🇫 +93 (Afghanistan)", length: 10 },
  { code: "+1268", label: "🇦🇬 +1268 (Antigua and Barbuda)", length: 10 },
  { code: "+1264", label: "🇦🇮 +1264 (Anguilla)", length: 10 },
  { code: "+355", label: "🇦🇱 +355 (Albania)", length: 10 },
  { code: "+374", label: "🇦🇲 +374 (Armenia)", length: 10 },
  { code: "+599", label: "🇦🇳 +599 (Netherlands Antilles)", length: 10 },
  { code: "+244", label: "🇦🇴 +244 (Angola)", length: 10 },
  { code: "+672", label: "🇦🇶 +672 (Antarctica)", length: 10 },
  { code: "+54", label: "🇦🇷 +54 (Argentina)", length: 10 },
  { code: "+1684", label: "🇦🇸 +1684 (AmericanSamoa)", length: 10 },
  { code: "+43", label: "🇦🇹 +43 (Austria)", length: 10 },
  { code: "+61", label: "🇦🇺 +61 (Australia)", length: 9 },
  { code: "+297", label: "🇦🇼 +297 (Aruba)", length: 10 },
  { code: "+358", label: "🇦🇽 +358 (Aland Islands)", length: 10 },
  { code: "+994", label: "🇦🇿 +994 (Azerbaijan)", length: 10 },
  { code: "+387", label: "🇧🇦 +387 (Bosnia and Herzeg...)", length: 10 },
  { code: "+1246", label: "🇧🇧 +1246 (Barbados)", length: 10 },
  { code: "+880", label: "🇧🇩 +880 (Bangladesh)", length: 10 },
  { code: "+32", label: "🇧🇪 +32 (Belgium)", length: 10 },
  { code: "+226", label: "🇧🇫 +226 (Burkina Faso)", length: 10 },
  { code: "+359", label: "🇧🇬 +359 (Bulgaria)", length: 10 },
  { code: "+973", label: "🇧🇭 +973 (Bahrain)", length: 10 },
  { code: "+257", label: "🇧🇮 +257 (Burundi)", length: 10 },
  { code: "+229", label: "🇧🇯 +229 (Benin)", length: 10 },
  { code: "+590", label: "🇧🇱 +590 (Saint Barthelemy)", length: 10 },
  { code: "+1441", label: "🇧🇲 +1441 (Bermuda)", length: 10 },
  { code: "+673", label: "🇧🇳 +673 (Brunei Darussalam)", length: 10 },
  { code: "+591", label: "🇧🇴 +591 (Bolivia)", length: 10 },
  { code: "+55", label: "🇧🇷 +55 (Brazil)", length: 11 },
  { code: "+1242", label: "🇧🇸 +1242 (Bahamas)", length: 10 },
  { code: "+975", label: "🇧🇹 +975 (Bhutan)", length: 10 },
  { code: "+267", label: "🇧🇼 +267 (Botswana)", length: 10 },
  { code: "+375", label: "🇧🇾 +375 (Belarus)", length: 10 },
  { code: "+501", label: "🇧🇿 +501 (Belize)", length: 10 },
  { code: "+61", label: "🇨🇨 +61 (Cocos (Keeling) I...)", length: 10 },
  { code: "+243", label: "🇨🇩 +243 (Congo)", length: 10 },
  { code: "+236", label: "🇨🇫 +236 (Central African R...)", length: 10 },
  { code: "+242", label: "🇨🇬 +242 (Congo)", length: 10 },
  { code: "+41", label: "🇨🇭 +41 (Switzerland)", length: 10 },
  { code: "+225", label: "🇨🇮 +225 (Cote d'Ivoire)", length: 10 },
  { code: "+682", label: "🇨🇰 +682 (Cook Islands)", length: 10 },
  { code: "+56", label: "🇨🇱 +56 (Chile)", length: 10 },
  { code: "+237", label: "🇨🇲 +237 (Cameroon)", length: 10 },
  { code: "+86", label: "🇨🇳 +86 (China)", length: 11 },
  { code: "+57", label: "🇨🇴 +57 (Colombia)", length: 10 },
  { code: "+506", label: "🇨🇷 +506 (Costa Rica)", length: 10 },
  { code: "+53", label: "🇨🇺 +53 (Cuba)", length: 10 },
  { code: "+238", label: "🇨🇻 +238 (Cape Verde)", length: 10 },
  { code: "+61", label: "🇨🇽 +61 (Christmas Island)", length: 10 },
  { code: "+357", label: "🇨🇾 +357 (Cyprus)", length: 10 },
  { code: "+420", label: "🇨🇿 +420 (Czech Republic)", length: 10 },
  { code: "+49", label: "🇩🇪 +49 (Germany)", length: 11 },
  { code: "+253", label: "🇩🇯 +253 (Djibouti)", length: 10 },
  { code: "+45", label: "🇩🇰 +45 (Denmark)", length: 10 },
  { code: "+1767", label: "🇩🇲 +1767 (Dominica)", length: 10 },
  { code: "+1849", label: "🇩🇴 +1849 (Dominican Republic)", length: 10 },
  { code: "+213", label: "🇩🇿 +213 (Algeria)", length: 10 },
  { code: "+593", label: "🇪🇨 +593 (Ecuador)", length: 10 },
  { code: "+372", label: "🇪🇪 +372 (Estonia)", length: 10 },
  { code: "+20", label: "🇪🇬 +20 (Egypt)", length: 10 },
  { code: "+291", label: "🇪🇷 +291 (Eritrea)", length: 10 },
  { code: "+34", label: "🇪🇸 +34 (Spain)", length: 9 },
  { code: "+251", label: "🇪🇹 +251 (Ethiopia)", length: 10 },
  { code: "+358", label: "🇫🇮 +358 (Finland)", length: 10 },
  { code: "+679", label: "🇫🇯 +679 (Fiji)", length: 10 },
  { code: "+500", label: "🇫🇰 +500 (Falkland Islands ...)", length: 10 },
  { code: "+691", label: "🇫🇲 +691 (Micronesia)", length: 10 },
  { code: "+298", label: "🇫🇴 +298 (Faroe Islands)", length: 10 },
  { code: "+33", label: "🇫🇷 +33 (France)", length: 9 },
  { code: "+241", label: "🇬🇦 +241 (Gabon)", length: 10 },
  { code: "+44", label: "🇬🇧 +44 (United Kingdom)", length: 10 },
  { code: "+1473", label: "🇬🇩 +1473 (Grenada)", length: 10 },
  { code: "+995", label: "🇬🇪 +995 (Georgia)", length: 10 },
  { code: "+594", label: "🇬🇫 +594 (French Guiana)", length: 10 },
  { code: "+44", label: "🇬🇬 +44 (Guernsey)", length: 10 },
  { code: "+233", label: "🇬🇭 +233 (Ghana)", length: 10 },
  { code: "+350", label: "🇬🇮 +350 (Gibraltar)", length: 10 },
  { code: "+299", label: "🇬🇱 +299 (Greenland)", length: 10 },
  { code: "+220", label: "🇬🇲 +220 (Gambia)", length: 10 },
  { code: "+224", label: "🇬🇳 +224 (Guinea)", length: 10 },
  { code: "+590", label: "🇬🇵 +590 (Guadeloupe)", length: 10 },
  { code: "+240", label: "🇬🇶 +240 (Equatorial Guinea)", length: 10 },
  { code: "+30", label: "🇬🇷 +30 (Greece)", length: 10 },
  { code: "+500", label: "🇬🇸 +500 (South Georgia and...)", length: 10 },
  { code: "+502", label: "🇬🇹 +502 (Guatemala)", length: 10 },
  { code: "+1671", label: "🇬🇺 +1671 (Guam)", length: 10 },
  { code: "+245", label: "🇬🇼 +245 (Guinea-Bissau)", length: 10 },
  { code: "+595", label: "🇬🇾 +595 (Guyana)", length: 10 },
  { code: "+852", label: "🇭🇰 +852 (Hong Kong)", length: 10 },
  { code: "+504", label: "🇭🇳 +504 (Honduras)", length: 10 },
  { code: "+385", label: "🇭🇷 +385 (Croatia)", length: 10 },
  { code: "+509", label: "🇭🇹 +509 (Haiti)", length: 10 },
  { code: "+36", label: "🇭🇺 +36 (Hungary)", length: 10 },
  { code: "+62", label: "🇮🇩 +62 (Indonesia)", length: 10 },
  { code: "+353", label: "🇮🇪 +353 (Ireland)", length: 10 },
  { code: "+972", label: "🇮🇱 +972 (Israel)", length: 10 },
  { code: "+44", label: "🇮🇲 +44 (Isle of Man)", length: 10 },
  { code: "+246", label: "🇮🇴 +246 (British Indian Oc...)", length: 10 },
  { code: "+964", label: "🇮🇶 +964 (Iraq)", length: 10 },
  { code: "+98", label: "🇮🇷 +98 (Iran)", length: 10 },
  { code: "+354", label: "🇮🇸 +354 (Iceland)", length: 10 },
  { code: "+39", label: "🇮🇹 +39 (Italy)", length: 10 },
  { code: "+44", label: "🇯🇪 +44 (Jersey)", length: 10 },
  { code: "+1876", label: "🇯🇲 +1876 (Jamaica)", length: 10 },
  { code: "+962", label: "🇯🇴 +962 (Jordan)", length: 10 },
  { code: "+81", label: "🇯🇵 +81 (Japan)", length: 10 },
  { code: "+254", label: "🇰🇪 +254 (Kenya)", length: 10 },
  { code: "+996", label: "🇰🇬 +996 (Kyrgyzstan)", length: 10 },
  { code: "+855", label: "🇰🇭 +855 (Cambodia)", length: 10 },
  { code: "+686", label: "🇰🇮 +686 (Kiribati)", length: 10 },
  { code: "+269", label: "🇰🇲 +269 (Comoros)", length: 10 },
  { code: "+1869", label: "🇰🇳 +1869 (Saint Kitts and N...)", length: 10 },
  { code: "+850", label: "🇰🇵 +850 (Korea)", length: 10 },
  { code: "+82", label: "🇰🇷 +82 (Korea)", length: 10 },
  { code: "+965", label: "🇰🇼 +965 (Kuwait)", length: 10 },
  { code: "+345", label: "🇰🇾 +345 (Cayman Islands)", length: 10 },
  { code: "+77", label: "🇰🇿 +77 (Kazakhstan)", length: 10 },
  { code: "+856", label: "🇱🇦 +856 (Laos)", length: 10 },
  { code: "+961", label: "🇱🇧 +961 (Lebanon)", length: 10 },
  { code: "+1758", label: "🇱🇨 +1758 (Saint Lucia)", length: 10 },
  { code: "+423", label: "🇱🇮 +423 (Liechtenstein)", length: 10 },
  { code: "+94", label: "🇱🇰 +94 (Sri Lanka)", length: 10 },
  { code: "+231", label: "🇱🇷 +231 (Liberia)", length: 10 },
  { code: "+266", label: "🇱🇸 +266 (Lesotho)", length: 10 },
  { code: "+370", label: "🇱🇹 +370 (Lithuania)", length: 10 },
  { code: "+352", label: "🇱🇺 +352 (Luxembourg)", length: 10 },
  { code: "+371", label: "🇱🇻 +371 (Latvia)", length: 10 },
  { code: "+218", label: "🇱🇾 +218 (Libyan Arab Jamah...)", length: 10 },
  { code: "+212", label: "🇲🇦 +212 (Morocco)", length: 10 },
  { code: "+377", label: "🇲🇨 +377 (Monaco)", length: 10 },
  { code: "+373", label: "🇲🇩 +373 (Moldova)", length: 10 },
  { code: "+382", label: "🇲🇪 +382 (Montenegro)", length: 10 },
  { code: "+590", label: "🇲🇫 +590 (Saint Martin)", length: 10 },
  { code: "+261", label: "🇲🇬 +261 (Madagascar)", length: 10 },
  { code: "+692", label: "🇲🇭 +692 (Marshall Islands)", length: 10 },
  { code: "+389", label: "🇲🇰 +389 (Macedonia)", length: 10 },
  { code: "+223", label: "🇲🇱 +223 (Mali)", length: 10 },
  { code: "+95", label: "🇲🇲 +95 (Myanmar)", length: 10 },
  { code: "+976", label: "🇲🇳 +976 (Mongolia)", length: 10 },
  { code: "+853", label: "🇲🇴 +853 (Macao)", length: 10 },
  { code: "+1670", label: "🇲🇵 +1670 (Northern Mariana ...)", length: 10 },
  { code: "+596", label: "🇲🇶 +596 (Martinique)", length: 10 },
  { code: "+222", label: "🇲🇷 +222 (Mauritania)", length: 10 },
  { code: "+1664", label: "🇲🇸 +1664 (Montserrat)", length: 10 },
  { code: "+356", label: "🇲🇹 +356 (Malta)", length: 10 },
  { code: "+230", label: "🇲🇺 +230 (Mauritius)", length: 10 },
  { code: "+960", label: "🇲🇻 +960 (Maldives)", length: 10 },
  { code: "+265", label: "🇲🇼 +265 (Malawi)", length: 10 },
  { code: "+52", label: "🇲🇽 +52 (Mexico)", length: 10 },
  { code: "+60", label: "🇲🇾 +60 (Malaysia)", length: 10 },
  { code: "+258", label: "🇲🇿 +258 (Mozambique)", length: 10 },
  { code: "+264", label: "🇳🇦 +264 (Namibia)", length: 10 },
  { code: "+687", label: "🇳🇨 +687 (New Caledonia)", length: 10 },
  { code: "+227", label: "🇳🇪 +227 (Niger)", length: 10 },
  { code: "+672", label: "🇳🇫 +672 (Norfolk Island)", length: 10 },
  { code: "+234", label: "🇳🇬 +234 (Nigeria)", length: 10 },
  { code: "+505", label: "🇳🇮 +505 (Nicaragua)", length: 10 },
  { code: "+31", label: "🇳🇱 +31 (Netherlands)", length: 10 },
  { code: "+47", label: "🇳🇴 +47 (Norway)", length: 10 },
  { code: "+977", label: "🇳🇵 +977 (Nepal)", length: 10 },
  { code: "+674", label: "🇳🇷 +674 (Nauru)", length: 10 },
  { code: "+683", label: "🇳🇺 +683 (Niue)", length: 10 },
  { code: "+64", label: "🇳🇿 +64 (New Zealand)", length: 10 },
  { code: "+968", label: "🇴🇲 +968 (Oman)", length: 10 },
  { code: "+507", label: "🇵🇦 +507 (Panama)", length: 10 },
  { code: "+51", label: "🇵🇪 +51 (Peru)", length: 10 },
  { code: "+689", label: "🇵🇫 +689 (French Polynesia)", length: 10 },
  { code: "+675", label: "🇵🇬 +675 (Papua New Guinea)", length: 10 },
  { code: "+63", label: "🇵🇭 +63 (Philippines)", length: 10 },
  { code: "+92", label: "🇵🇰 +92 (Pakistan)", length: 10 },
  { code: "+48", label: "🇵🇱 +48 (Poland)", length: 10 },
  { code: "+508", label: "🇵🇲 +508 (Saint Pierre and ...)", length: 10 },
  { code: "+872", label: "🇵🇳 +872 (Pitcairn)", length: 10 },
  { code: "+1939", label: "🇵🇷 +1939 (Puerto Rico)", length: 10 },
  { code: "+970", label: "🇵🇸 +970 (Palestinian Terri...)", length: 10 },
  { code: "+351", label: "🇵🇹 +351 (Portugal)", length: 10 },
  { code: "+680", label: "🇵🇼 +680 (Palau)", length: 10 },
  { code: "+595", label: "🇵🇾 +595 (Paraguay)", length: 10 },
  { code: "+974", label: "🇶🇦 +974 (Qatar)", length: 10 },
  { code: "+262", label: "🇷🇪 +262 (Reunion)", length: 10 },
  { code: "+40", label: "🇷🇴 +40 (Romania)", length: 10 },
  { code: "+381", label: "🇷🇸 +381 (Serbia)", length: 10 },
  { code: "+7", label: "🇷🇺 +7 (Russia)", length: 10 },
  { code: "+250", label: "🇷🇼 +250 (Rwanda)", length: 10 },
  { code: "+966", label: "🇸🇦 +966 (Saudi Arabia)", length: 10 },
  { code: "+677", label: "🇸🇧 +677 (Solomon Islands)", length: 10 },
  { code: "+248", label: "🇸🇨 +248 (Seychelles)", length: 10 },
  { code: "+249", label: "🇸🇩 +249 (Sudan)", length: 10 },
  { code: "+46", label: "🇸🇪 +46 (Sweden)", length: 10 },
  { code: "+65", label: "🇸🇬 +65 (Singapore)", length: 8 },
  { code: "+290", label: "🇸🇭 +290 (Saint Helena)", length: 10 },
  { code: "+386", label: "🇸🇮 +386 (Slovenia)", length: 10 },
  { code: "+47", label: "🇸🇯 +47 (Svalbard and Jan ...)", length: 10 },
  { code: "+421", label: "🇸🇰 +421 (Slovakia)", length: 10 },
  { code: "+232", label: "🇸🇱 +232 (Sierra Leone)", length: 10 },
  { code: "+378", label: "🇸🇲 +378 (San Marino)", length: 10 },
  { code: "+221", label: "🇸🇳 +221 (Senegal)", length: 10 },
  { code: "+252", label: "🇸🇴 +252 (Somalia)", length: 10 },
  { code: "+597", label: "🇸🇷 +597 (Suriname)", length: 10 },
  { code: "+211", label: "🇸🇸 +211 (South Sudan)", length: 10 },
  { code: "+239", label: "🇸🇹 +239 (Sao Tome and Prin...)", length: 10 },
  { code: "+503", label: "🇸🇻 +503 (El Salvador)", length: 10 },
  { code: "+963", label: "🇸🇾 +963 (Syrian Arab Republic)", length: 10 },
  { code: "+268", label: "🇸🇿 +268 (Swaziland)", length: 10 },
  { code: "+1649", label: "🇹🇨 +1649 (Turks and Caicos ...)", length: 10 },
  { code: "+235", label: "🇹🇩 +235 (Chad)", length: 10 },
  { code: "+228", label: "🇹🇬 +228 (Togo)", length: 10 },
  { code: "+66", label: "🇹🇭 +66 (Thailand)", length: 10 },
  { code: "+992", label: "🇹🇯 +992 (Tajikistan)", length: 10 },
  { code: "+690", label: "🇹🇰 +690 (Tokelau)", length: 10 },
  { code: "+670", label: "🇹🇱 +670 (Timor-Leste)", length: 10 },
  { code: "+993", label: "🇹🇲 +993 (Turkmenistan)", length: 10 },
  { code: "+216", label: "🇹🇳 +216 (Tunisia)", length: 10 },
  { code: "+676", label: "🇹🇴 +676 (Tonga)", length: 10 },
  { code: "+90", label: "🇹🇷 +90 (Turkey)", length: 10 },
  { code: "+1868", label: "🇹🇹 +1868 (Trinidad and Tobago)", length: 10 },
  { code: "+688", label: "🇹🇻 +688 (Tuvalu)", length: 10 },
  { code: "+886", label: "🇹🇼 +886 (Taiwan)", length: 10 },
  { code: "+255", label: "🇹🇿 +255 (Tanzania)", length: 10 },
  { code: "+380", label: "🇺🇦 +380 (Ukraine)", length: 10 },
  { code: "+256", label: "🇺🇬 +256 (Uganda)", length: 10 },
  { code: "+598", label: "🇺🇾 +598 (Uruguay)", length: 10 },
  { code: "+998", label: "🇺🇿 +998 (Uzbekistan)", length: 10 },
  { code: "+379", label: "🇻🇦 +379 (Holy See (Vatican...)", length: 10 },
  { code: "+1784", label: "🇻🇨 +1784 (Saint Vincent and...)", length: 10 },
  { code: "+58", label: "🇻🇪 +58 (Venezuela)", length: 10 },
  { code: "+1284", label: "🇻🇬 +1284 (Virgin Islands)", length: 10 },
  { code: "+1340", label: "🇻🇮 +1340 (Virgin Islands)", length: 10 },
  { code: "+84", label: "🇻🇳 +84 (Vietnam)", length: 10 },
  { code: "+678", label: "🇻🇺 +678 (Vanuatu)", length: 10 },
  { code: "+681", label: "🇼🇫 +681 (Wallis and Futuna)", length: 10 },
  { code: "+685", label: "🇼🇸 +685 (Samoa)", length: 10 },
  { code: "+967", label: "🇾🇪 +967 (Yemen)", length: 10 },
  { code: "+262", label: "🇾🇹 +262 (Mayotte)", length: 10 },
  { code: "+27", label: "🇿🇦 +27 (South Africa)", length: 9 },
  { code: "+260", label: "🇿🇲 +260 (Zambia)", length: 10 },
  { code: "+263", label: "🇿🇼 +263 (Zimbabwe)", length: 10 },
];

export interface PhoneInputProps {
  value?: string;
  onChange?: (val: string) => void;
  className?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export function PhoneInput({
  value = "",
  onChange,
  className,
  id,
  placeholder = "Enter 10-digit phone number",
  disabled = false,
  required = false,
  ...props
}: PhoneInputProps) {
  // Local state to track focus state of the select element
  const [isFocused, setIsFocused] = React.useState(false);

  // Local state to track the active country selection index in COUNTRY_CODES
  const [selectedIndex, setSelectedIndex] = React.useState<number>(() => {
    const clean = value || "";
    const matches: { index: number; country: (typeof COUNTRY_CODES)[0] }[] = [];
    COUNTRY_CODES.forEach((c, idx) => {
      if (clean.startsWith(c.code)) {
        matches.push({ index: idx, country: c });
      }
    });

    if (matches.length > 0) {
      // Find the one where the rest of the string has the target length
      const localPart = clean.slice(matches[0].country.code.length);
      const perfectMatch = matches.find(
        (m) => localPart.length === m.country.length,
      );
      if (perfectMatch) {
        return perfectMatch.index;
      }
      return matches[0].index;
    }
    return 0; // Default to India (+91)
  });

  // Track the previous value to know when it changed from the outside (e.g. form load or reset)
  const [prevValue, setPrevValue] = React.useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    const clean = value || "";
    const currentCountry = COUNTRY_CODES[selectedIndex];
    const startsWithCurrent =
      currentCountry && clean.startsWith(currentCountry.code);
    if (!startsWithCurrent) {
      const matches: { index: number; country: (typeof COUNTRY_CODES)[0] }[] =
        [];
      COUNTRY_CODES.forEach((c, idx) => {
        if (clean.startsWith(c.code)) {
          matches.push({ index: idx, country: c });
        }
      });
      if (matches.length > 0) {
        const localPart = clean.slice(matches[0].country.code.length);
        const perfectMatch = matches.find(
          (m) => localPart.length === m.country.length,
        );
        if (perfectMatch) {
          setSelectedIndex(perfectMatch.index);
        } else {
          setSelectedIndex(matches[0].index);
        }
      } else {
        if (!clean.startsWith("+")) {
          setSelectedIndex(0); // reset to India if no code prefix at all
        }
      }
    }
  }

  const currentCountry = COUNTRY_CODES[selectedIndex] || COUNTRY_CODES[0];

  // Resolve countryCode and localNumber from value
  const { countryCode, localNumber } = React.useMemo(() => {
    const clean = value || "";
    const activeCode = currentCountry.code;
    if (clean.startsWith(activeCode)) {
      return {
        countryCode: activeCode,
        localNumber: clean.slice(activeCode.length),
      };
    }
    if (clean.startsWith("+")) {
      // Fallback parsing for unrecognized or other code prefix
      const sortedCodes = [...COUNTRY_CODES].sort(
        (a, b) => b.code.length - a.code.length,
      );
      const match = sortedCodes.find((c) => clean.startsWith(c.code));
      if (match) {
        return {
          countryCode: match.code,
          localNumber: clean.slice(match.code.length),
        };
      }
      const parts = clean.match(/^(\+\d{1,4})(.*)$/);
      if (parts) {
        return {
          countryCode: parts[1],
          localNumber: parts[2],
        };
      }
    }
    return {
      countryCode: activeCode,
      localNumber: clean,
    };
  }, [value, currentCountry]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = Number.parseInt(e.target.value, 10);
    if (idx === -1) return;
    const newCountry = COUNTRY_CODES[idx];
    if (newCountry) {
      setSelectedIndex(idx);
      const maxLength = newCountry.length;
      const cleanDigits = localNumber.replace(/\D/g, "");
      const truncated = cleanDigits.slice(0, maxLength);
      if (onChange) {
        onChange(newCountry.code + truncated);
      }
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    const maxLength = currentCountry.length;
    const truncated = digits.slice(0, maxLength);
    if (onChange) {
      onChange(countryCode + truncated);
    }
  };

  const getCompactLabel = (c: (typeof COUNTRY_CODES)[0]) => {
    if (!c) return "";
    const parts = c.label.split(" ");
    return `${parts[0]} ${parts[1]}`; // e.g. "🇮🇳 +91"
  };

  const targetLength = currentCountry.length;
  const isInvalid =
    localNumber.length > 0 && localNumber.length !== targetLength;
  const dynamicPlaceholder = placeholder.replace(
    /\d+-digit/g,
    `${targetLength}-digit`,
  );
  const compactLabel = getCompactLabel(currentCountry);

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex gap-2 w-full">
        <div
          className={cn(
            "relative flex-shrink-0 w-[96px]",
            className?.includes("h-11") && "h-11 rounded-xl",
          )}
        >
          {/* Invisible Native Select */}
          <select
            value={selectedIndex}
            onChange={handleCountryChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
          >
            {COUNTRY_CODES.map((c, idx) => (
              <option
                key={`${c.code}-${idx}`}
                value={idx}
                className="bg-popover text-popover-foreground"
              >
                {c.label}
              </option>
            ))}
            {!COUNTRY_CODES.some((c) => c.code === countryCode) && (
              <option value={-1} className="bg-popover text-popover-foreground">
                🏳️ {countryCode}
              </option>
            )}
          </select>

          {/* Styled Visual Trigger */}
          <div
            className={cn(
              "h-9 px-2.5 flex items-center justify-between bg-background border border-input rounded-md text-sm font-semibold text-slate-800 dark:text-slate-100 transition-[border-color,box-shadow] select-none pointer-events-none dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xs",
              className?.includes("h-11") && "h-11 rounded-xl px-3.5",
              className?.includes("bg-muted/40") && "bg-muted/40",
              className?.includes("bg-zinc-50") &&
                "bg-zinc-50 dark:bg-zinc-900",
              disabled && "opacity-50",
              isFocused && "border-ring ring-ring/50 ring-[3px]",
            )}
          >
            <span>{compactLabel || countryCode}</span>
            <svg
              className="w-3.5 h-3.5 ml-1 text-slate-400 dark:text-slate-500 flex-shrink-0 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        <Input
          id={id}
          type="tel"
          value={localNumber}
          onChange={handleNumberChange}
          placeholder={dynamicPlaceholder}
          disabled={disabled}
          required={required}
          className={cn(
            "flex-1",
            isInvalid &&
              "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive dark:focus-visible:ring-destructive/40",
            className,
          )}
          {...props}
        />
      </div>
      {isInvalid && (
        <p className="text-[11px] font-medium text-destructive tracking-wide animate-fade-in">
          Phone number must be exactly {targetLength} digits. (Current:{" "}
          {localNumber.length})
        </p>
      )}
    </div>
  );
}
