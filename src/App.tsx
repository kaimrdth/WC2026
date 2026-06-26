import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import type { ReactNode, CSSProperties, PointerEvent } from "react";
import { RotateCcw, ChevronDown, ChevronUp, Info, Star, Check, X, Loader2, AlertCircle, Users, BarChart3, Medal, Ticket, ArrowDown, ArrowUp, ArrowLeftRight, CalendarClock, Sparkles, Trophy } from "lucide-react";

const CONFED: Record<string, { label: string; color: string }> = {
  UEFA: { label: "UEFA", color: "#3D5FE0" },
  CONMEBOL: { label: "CONMEBOL", color: "#C98A2B" },
  CONCACAF: { label: "CONCACAF", color: "#D03A22" },
  CAF: { label: "CAF", color: "#2F9D63" },
  AFC: { label: "AFC", color: "#1F9C9C" },
  OFC: { label: "OFC", color: "#8B4FC4" },
};

interface Team {
  code: string;
  name: string;
  group: string;
  rating: number;
  fifaRank: number;
  confed: string;
}

// FIFA 3-letter code → flag-icons code (ISO 3166-1 alpha-2, with GB sub-flags).
const FLAG_ISO: Record<string, string> = {
  MEX:"mx",KOR:"kr",RSA:"za",CZE:"cz",CAN:"ca",SUI:"ch",QAT:"qa",BIH:"ba",
  BRA:"br",MAR:"ma",SCO:"gb-sct",HAI:"ht",USA:"us",PAR:"py",AUS:"au",TUR:"tr",
  GER:"de",ECU:"ec",CIV:"ci",CUW:"cw",NED:"nl",JPN:"jp",TUN:"tn",SWE:"se",
  BEL:"be",IRN:"ir",EGY:"eg",NZL:"nz",ESP:"es",URU:"uy",KSA:"sa",CPV:"cv",
  FRA:"fr",SEN:"sn",NOR:"no",IRQ:"iq",ARG:"ar",AUT:"at",ALG:"dz",JOR:"jo",
  POR:"pt",COL:"co",UZB:"uz",COD:"cd",ENG:"gb-eng",CRO:"hr",PAN:"pa",GHA:"gh",
};

// Custom inline soccer-ball icon (lucide has none); inherits currentColor.
function BallIcon({size=12,className=""}:{size?:number;className?:string}) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5"/>
      <polygon points="12,8 15.2,10.3 14,14 10,14 8.8,10.3"/>
      <path d="M12 8V2.8M15.2 10.3l5-1.7M14 14l3 4.2M10 14l-3 4.2M8.8 10.3l-5-1.7"/>
    </svg>
  );
}
function CardIcon({red=false}:{red?:boolean}) {
  return <span className={`wc-cardicon${red?" wc-cardicon-r":""}`} role="img" aria-label={red?"red card":"yellow card"}/>;
}

// Circular flag: a centered SVG background clipped to a circle (assets in /flags).
function Flag({code,className=""}:{code:string;className?:string}) {
  const iso=FLAG_ISO[code];
  if(!iso) return <span className={`wc-flag wc-flag-unknown ${className}`} aria-hidden="true"/>;
  return <span className={`wc-flag ${className}`} role="img" aria-label={code}
    style={{backgroundImage:`url(/flags/${iso}.svg)`}}/>;
}

const TEAM_DATA: Team[] = [
  { code:"MEX",name:"Mexico",group:"A",rating:86,fifaRank:15,confed:"CONCACAF" },
  { code:"KOR",name:"South Korea",group:"A",rating:79,fifaRank:25,confed:"AFC" },
  { code:"RSA",name:"South Africa",group:"A",rating:67,fifaRank:60,confed:"CAF" },
  { code:"CZE",name:"Czechia",group:"A",rating:73,fifaRank:41,confed:"UEFA" },
  { code:"CAN",name:"Canada",group:"B",rating:78,fifaRank:30,confed:"CONCACAF" },
  { code:"SUI",name:"Switzerland",group:"B",rating:83,fifaRank:19,confed:"UEFA" },
  { code:"QAT",name:"Qatar",group:"B",rating:76,fifaRank:35,confed:"AFC" },
  { code:"BIH",name:"Bosnia-Herzegovina",group:"B",rating:69,fifaRank:52,confed:"UEFA" },
  { code:"BRA",name:"Brazil",group:"C",rating:92,fifaRank:6,confed:"CONMEBOL" },
  { code:"MAR",name:"Morocco",group:"C",rating:91,fifaRank:8,confed:"CAF" },
  { code:"SCO",name:"Scotland",group:"C",rating:71,fifaRank:47,confed:"UEFA" },
  { code:"HAI",name:"Haiti",group:"C",rating:61,fifaRank:83,confed:"CONCACAF" },
  { code:"USA",name:"United States",group:"D",rating:85,fifaRank:16,confed:"CONCACAF" },
  { code:"PAR",name:"Paraguay",group:"D",rating:65,fifaRank:64,confed:"CONMEBOL" },
  { code:"AUS",name:"Australia",group:"D",rating:80,fifaRank:26,confed:"AFC" },
  { code:"TUR",name:"Turkiye",group:"D",rating:72,fifaRank:42,confed:"UEFA" },
  { code:"GER",name:"Germany",group:"E",rating:89,fifaRank:10,confed:"UEFA" },
  { code:"ECU",name:"Ecuador",group:"E",rating:81,fifaRank:24,confed:"CONMEBOL" },
  { code:"CIV",name:"Ivory Coast",group:"E",rating:77,fifaRank:33,confed:"CAF" },
  { code:"CUW",name:"Curacao",group:"E",rating:62,fifaRank:81,confed:"CONCACAF" },
  { code:"NED",name:"Netherlands",group:"F",rating:91,fifaRank:7,confed:"UEFA" },
  { code:"JPN",name:"Japan",group:"F",rating:84,fifaRank:18,confed:"AFC" },
  { code:"TUN",name:"Tunisia",group:"F",rating:74,fifaRank:40,confed:"CAF" },
  { code:"SWE",name:"Sweden",group:"F",rating:75,fifaRank:39,confed:"UEFA" },
  { code:"BEL",name:"Belgium",group:"G",rating:90,fifaRank:9,confed:"UEFA" },
  { code:"IRN",name:"Iran",group:"G",rating:82,fifaRank:21,confed:"AFC" },
  { code:"EGY",name:"Egypt",group:"G",rating:78,fifaRank:29,confed:"CAF" },
  { code:"NZL",name:"New Zealand",group:"G",rating:60,fifaRank:95,confed:"OFC" },
  { code:"ESP",name:"Spain",group:"H",rating:95,fifaRank:2,confed:"UEFA" },
  { code:"URU",name:"Uruguay",group:"H",rating:85,fifaRank:17,confed:"CONMEBOL" },
  { code:"KSA",name:"Saudi Arabia",group:"H",rating:68,fifaRank:57,confed:"AFC" },
  { code:"CPV",name:"Cape Verde",group:"H",rating:62,fifaRank:70,confed:"CAF" },
  { code:"FRA",name:"France",group:"I",rating:96,fifaRank:1,confed:"UEFA" },
  { code:"SEN",name:"Senegal",group:"I",rating:87,fifaRank:14,confed:"CAF" },
  { code:"NOR",name:"Norway",group:"I",rating:71,fifaRank:44,confed:"UEFA" },
  { code:"IRQ",name:"Iraq",group:"I",rating:66,fifaRank:61,confed:"AFC" },
  { code:"ARG",name:"Argentina",group:"J",rating:94,fifaRank:3,confed:"CONMEBOL" },
  { code:"AUT",name:"Austria",group:"J",rating:81,fifaRank:23,confed:"UEFA" },
  { code:"ALG",name:"Algeria",group:"J",rating:75,fifaRank:36,confed:"CAF" },
  { code:"JOR",name:"Jordan",group:"J",rating:63,fifaRank:68,confed:"AFC" },
  { code:"POR",name:"Portugal",group:"K",rating:93,fifaRank:5,confed:"UEFA" },
  { code:"COL",name:"Colombia",group:"K",rating:88,fifaRank:13,confed:"CONMEBOL" },
  { code:"UZB",name:"Uzbekistan",group:"K",rating:65,fifaRank:62,confed:"AFC" },
  { code:"COD",name:"DR Congo",group:"K",rating:70,fifaRank:51,confed:"CAF" },
  { code:"ENG",name:"England",group:"L",rating:94,fifaRank:4,confed:"UEFA" },
  { code:"CRO",name:"Croatia",group:"L",rating:88,fifaRank:11,confed:"UEFA" },
  { code:"PAN",name:"Panama",group:"L",rating:68,fifaRank:53,confed:"CONCACAF" },
  { code:"GHA",name:"Ghana",group:"L",rating:64,fifaRank:65,confed:"CAF" },
];

const TEAMS: Team[] = TEAM_DATA;
const GROUP_LETTERS = ["A","B","C","D","E","F","G","H","I","J","K","L"];
const TEAM_BY_CODE: Record<string, Team> = Object.fromEntries(TEAMS.map(t => [t.code, t]));

// ── Per-team theming ──────────────────────────────────────────────────────────
// Each team has TWO colours — `a` tints the background, `b` tints the cards — plus an
// `accent` (replaces the gold). Two hues let two-colour sides (Portugal red+green) read
// as both. Default is a dark theme (light text); `mode:"light"` flips to a near-white
// base with dark text for sides like Japan. Colours are auto-adjusted for legibility.
interface TeamTheme { a:string; b:string; accent:string; mode?:"light"|"vivid"; }
const TEAM_COLORS: Record<string,TeamTheme> = {
  MEX:{a:"#006847",b:"#9D2235",accent:"#E63946"}, KOR:{a:"#CD2E3A",b:"#003478",accent:"#5A9BE0"}, RSA:{a:"#007749",b:"#001489",accent:"#FFB81C"}, CZE:{a:"#D7141A",b:"#11457E",accent:"#5A9BE0"},
  CAN:{a:"#C8102E",b:"#7A0C1C",accent:"#FF5C5C"}, SUI:{a:"#D52B1E",b:"#7A0C12",accent:"#FF6B6B"}, QAT:{a:"#8A1538",b:"#5A0E25",accent:"#E0A9B8"}, BIH:{a:"#002395",b:"#FFD100",accent:"#FFD100"},
  BRA:{a:"#009C3B",b:"#F7D000",accent:"#F7D000"}, MAR:{a:"#C1272D",b:"#006233",accent:"#2E9E5B"}, SCO:{a:"#0065BF",b:"#003E73",accent:"#5AA0E0"}, HAI:{a:"#00209F",b:"#D21034",accent:"#FF5C6E"},
  USA:{a:"#0A3161",b:"#B31942",accent:"#7BA4D9"}, PAR:{a:"#0038A8",b:"#D52B1E",accent:"#FF5C5C"}, AUS:{a:"#FFCD00",b:"#00843D",accent:"#00843D",mode:"vivid"}, TUR:{a:"#E30A17",b:"#8A0610",accent:"#FF6B6B"},
  GER:{a:"#1A1A1A",b:"#BB0A1E",accent:"#FFCC00"}, ECU:{a:"#FFD400",b:"#0072CE",accent:"#0072CE",mode:"vivid"}, CIV:{a:"#FF8200",b:"#009A44",accent:"#009A44",mode:"vivid"}, CUW:{a:"#002B7F",b:"#0A1E4D",accent:"#F9E814"},
  NED:{a:"#FF6A00",b:"#1B458F",accent:"#1B458F",mode:"vivid"}, JPN:{a:"#1A2A8C",b:"#101A5E",accent:"#F4F1E8"}, TUN:{a:"#E70013",b:"#8A000B",accent:"#FF5A5A"}, SWE:{a:"#006AA7",b:"#FFCC00",accent:"#FFCC00"},
  BEL:{a:"#C8102E",b:"#1A1A1A",accent:"#FDDA24"}, IRN:{a:"#239F40",b:"#DA0000",accent:"#3FBF63"}, EGY:{a:"#CE1126",b:"#1A1A1A",accent:"#C8A02E"}, NZL:{a:"#00247D",b:"#FFFFFF",accent:"#CC142B"},
  ESP:{a:"#AA151B",b:"#5C0A0E",accent:"#F1BF00"}, URU:{a:"#6CB7EA",b:"#123A6B",accent:"#123A6B",mode:"vivid"}, KSA:{a:"#006C35",b:"#00451F",accent:"#2E9E5B"}, CPV:{a:"#003893",b:"#CF2027",accent:"#5A9BE0"},
  FRA:{a:"#0055A4",b:"#C8102E",accent:"#EF6B5E"}, SEN:{a:"#00853F",b:"#E31B23",accent:"#FDEF42"}, NOR:{a:"#BA0C2F",b:"#00205B",accent:"#7BA4D9"}, IRQ:{a:"#007A3D",b:"#CE1126",accent:"#3FBF63"},
  ARG:{a:"#74ACDF",b:"#FFFFFF",accent:"#2F6BB3",mode:"light"}, AUT:{a:"#ED2939",b:"#8A1019",accent:"#FF6B6B"}, ALG:{a:"#006233",b:"#D21034",accent:"#3FBF63"}, JOR:{a:"#1A1A1A",b:"#007A3D",accent:"#CE1126"},
  POR:{a:"#C8102E",b:"#006600",accent:"#FFD700"}, COL:{a:"#FCD116",b:"#003893",accent:"#C81E3A",mode:"vivid"}, UZB:{a:"#0099B5",b:"#1EB53A",accent:"#33C7E0"}, COD:{a:"#007FFF",b:"#CE1021",accent:"#F7D518"},
  ENG:{a:"#FFFFFF",b:"#0A2472",accent:"#CE1124",mode:"light"}, CRO:{a:"#171796",b:"#C8102E",accent:"#FF5C6E"}, PAN:{a:"#005293",b:"#D21034",accent:"#5A9BE0"}, GHA:{a:"#006B3F",b:"#CE1126",accent:"#FCD116"},
};
const hexToRgb=(h:string)=>{const n=h.replace("#","");const v=n.length===3?n.split("").map(c=>c+c).join(""):n;const i=parseInt(v,16);return {r:(i>>16)&255,g:(i>>8)&255,b:i&255};};
const rgbToHex=({r,g,b}:{r:number;g:number;b:number})=>{const c=(x:number)=>Math.round(Math.max(0,Math.min(255,x))).toString(16).padStart(2,"0");return `#${c(r)}${c(g)}${c(b)}`;};
const mixHex=(a:string,b:string,t:number)=>{const x=hexToRgb(a),y=hexToRgb(b);return rgbToHex({r:x.r+(y.r-x.r)*t,g:x.g+(y.g-x.g)*t,b:x.b+(y.b-x.b)*t});};
const relLum=(h:string)=>{const {r,g,b}=hexToRgb(h);const f=(c:number)=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);};return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b);};
const brighten=(h:string,target=0.45)=>{let c=h,g=0;while(relLum(c)<target&&g<8){c=mixHex(c,"#ffffff",0.16);g++;}return c;};
const darken=(h:string,target=0.42)=>{let c=h,g=0;while(relLum(c)>target&&g<8){c=mixHex(c,"#000000",0.16);g++;}return c;};
const rgbaHex=(h:string,a:number)=>{const {r,g,b}=hexToRgb(h);return `rgba(${r},${g},${b},${a})`;};
// Build the CSS-variable overrides for a team (or {} for the default green/gold theme).
function teamTheme(code:string|null):CSSProperties{
  if(!code||!TEAM_COLORS[code]) return {};
  const {a,b,accent,mode}=TEAM_COLORS[code];
  if(mode==="vivid"){
    // The team colour itself dominates the background; dark text + light cards on top.
    const ac=darken(accent);
    return {
      ["--pitch" as string]:a,
      ["--pitch-deep" as string]:mixHex(a,"#ffffff",0.50),  // light → reads as text on the dark accent dots
      ["--pitch-card" as string]:mixHex("#ffffff",a,0.10),  // light cards float on the colour
      ["--pitch-line" as string]:rgbaHex(ac,0.28),
      ["--gold" as string]:ac,
      ["--gold-soft" as string]:rgbaHex(ac,0.14),
      ["--chalk" as string]:"#1c1c1c",
      ["--chalk-dim" as string]:"#4d4d4d",
    } as CSSProperties;
  }
  if(mode==="light"){
    const ac=darken(accent);                          // dark enough to read on a light bg
    const pitch=mixHex("#ffffff",a,0.05);
    return {
      ["--pitch" as string]:pitch,
      ["--pitch-deep" as string]:mixHex(pitch,"#000000",0.06),
      ["--pitch-card" as string]:mixHex("#ffffff",b,0.12),
      ["--pitch-line" as string]:rgbaHex(ac,0.30),
      ["--gold" as string]:ac,
      ["--gold-soft" as string]:rgbaHex(ac,0.12),
      ["--chalk" as string]:"#1c1c1c",
      ["--chalk-dim" as string]:"#6a6a6a",
    } as CSSProperties;
  }
  const ac=brighten(accent);                          // bright enough to read on the dark bg
  return {
    ["--pitch" as string]:mixHex("#0a130d",a,0.18),
    ["--pitch-deep" as string]:mixHex("#070f0a",a,0.12),
    ["--pitch-card" as string]:mixHex("#0e1812",b,0.30),
    ["--pitch-line" as string]:rgbaHex(ac,0.22),
    ["--gold" as string]:ac,
    ["--gold-soft" as string]:rgbaHex(ac,0.15),
    ["--chalk" as string]:"#F4F1E8",
    ["--chalk-dim" as string]:"#AFC0B9",
  } as CSSProperties;
}
// Scope a pitch (lineup) to one team's kit accent, so a two-team modal shows each side in
// its own colours instead of the ambient app theme's accent.
const KIT_COLORS: Record<string,{bg:string;text:string;border?:string}> = {
  JPN:{bg:"#0B1F4D",text:"#FFFFFF"},
  CIV:{bg:"#F77F00",text:"#009A44"},
  POR:{bg:"#C8102E",text:"#FFD700"},
  NED:{bg:"#FF6A00",text:"#111111"},
  MAR:{bg:"#C1272D",text:"#006233"},
  IRN:{bg:"#FFFFFF",text:"#239F40",border:"#239F40"},
  AUS:{bg:"#FFCD00",text:"#00843D"},
  FRA:{bg:"#1D3C91",text:"#FFFFFF"},
  NOR:{bg:"#BA0C2F",text:"#FFFFFF"},
  ESP:{bg:"#C60B1E",text:"#FFD700"},
  ENG:{bg:"#FFFFFF",text:"#C8102E",border:"#C8102E"},
};
function pitchAccentStyle(code:string):CSSProperties{
  const kit=KIT_COLORS[code];
  if(kit) return {
    ["--kit-bg" as string]:kit.bg,
    ["--kit-text" as string]:kit.text,
    ["--kit-border" as string]:kit.border ?? "#F4F1E8",
  } as CSSProperties;
  const a=TEAM_COLORS[code]?.accent;
  const ac=a?brighten(a):undefined;
  return ac?({
    ["--gold" as string]:ac,
    ["--kit-bg" as string]:ac,
    ["--kit-text" as string]:"#111111",
    ["--kit-border" as string]:"#F4F1E8",
  } as CSSProperties):{};
}
const groupTeams = (letter: string) => TEAMS.filter(t => t.group === letter);

interface Player { pos: string; name?: string; club?: string; }
interface TeamProfile { formation: string; confirmed: boolean; narrative: string; xi: Player[]; }

const TEAM_PROFILES: Record<string, TeamProfile> = {
  // ── GROUP A ──────────────────────────────────────────────────────────────
  MEX:{formation:"4-1-4-1",confirmed:true,narrative:"Hosting a World Cup for an unmatched third time, Mexico carry home advantage and Guillermo Ochoa heading to a record-equalling sixth World Cup. Javier Aguirre's side is built to frustrate and counter, with Santiago Giménez the focal point.",
    xi:[{name:"Raul Rangel",club:"Chivas",pos:"GK"},{name:"Israel Reyes",club:"Club America",pos:"RB"},{name:"Johan Vasquez",club:"Genoa",pos:"CB"},{name:"Nestor Araujo",club:"Club America",pos:"CB"},{name:"Jesus Gallardo",club:"Toluca",pos:"LB"},{name:"Edson Alvarez (C)",club:"Fenerbahce",pos:"CM"},{name:"Erick Gutierrez",club:"PSV",pos:"RM"},{name:"Orbelin Pineda",club:"Cruz Azul",pos:"CM"},{name:"Hirving Lozano",club:"PSV",pos:"LM"},{name:"Roberto Alvarado",club:"Chivas",pos:"AM"},{name:"Santiago Gimenez",club:"AC Milan",pos:"ST"}]},
  KOR:{formation:"4-2-3-1",confirmed:true,narrative:"South Korea arrive at a 12th World Cup under coach Hong Myung-bo, with Son Heung-min captaining what could be his final major tournament. Lee Kang-in's creativity off the right flank is their biggest weapon.",
    xi:[{name:"Kim Seung-gyu",club:"FC Tokyo",pos:"GK"},{name:"Kim Moon-hwan",club:"Jeonbuk",pos:"RB"},{name:"Kim Min-jae",club:"Bayern Munich",pos:"CB"},{name:"Jung Seung-hyun",club:"Al-Shabab",pos:"CB"},{name:"Kim Jin-su",club:"Ulsan",pos:"LB"},{name:"Park Yong-woo",club:"Suwon FC",pos:"CM"},{name:"Baek Seung-ho",club:"Kashiwa Reysol",pos:"CM"},{name:"Lee Kang-in",club:"PSG",pos:"RW"},{name:"Hwang In-beom",club:"Vancouver Whitecaps",pos:"AM"},{name:"Hwang Hee-chan",club:"Wolves",pos:"LW"},{name:"Son Heung-min (C)",club:"LAFC",pos:"ST"}]},
  RSA:{formation:"5-3-2",confirmed:true,narrative:"South Africa's Bafana Bafana return under coach Hugo Broos with captain and goalkeeper Ronwen Williams — one of the world's best shot-stoppers — anchoring a disciplined defensive setup.",
    xi:[{name:"Ronwen Williams (C)",club:"Mamelodi Sundowns",pos:"GK"},{name:"Khuliso Mudau",club:"Mamelodi Sundowns",pos:"RB"},{name:"Mbekezeli Mbokazi",club:"AmaZulu",pos:"CB"},{name:"Siyabonga Ngezana",club:"Kasimpasa",pos:"CB"},{name:"Nkosinathi Sibisi",club:"Orlando Pirates",pos:"CB"},{name:"Aubrey Modiba",club:"Mamelodi Sundowns",pos:"LB"},{name:"Jayden Adams",club:"Charlotte FC",pos:"CM"},{name:"Thalente Mbatha",club:"Mamelodi Sundowns",pos:"CM"},{name:"Teboho Mokoena",club:"SuperSport Utd",pos:"CM"},{name:"Percy Tau",club:"Al Ahly",pos:"ST"},{name:"Lyle Foster",club:"Burnley",pos:"ST"}]},
  CZE:{formation:"4-2-3-1",confirmed:true,narrative:"Czechia are back at a World Cup for the first time since 2006, having beaten Denmark on penalties in the playoff final. Matej Kovar in goal and Patrik Schick up top are the class acts of Miroslav Koubek's squad.",
    xi:[{name:"Matej Kovar",club:"Bayer Leverkusen",pos:"GK"},{name:"Vladimir Coufal",club:"West Ham",pos:"RB"},{name:"Robin Hranac",club:"Plzen",pos:"CB"},{name:"Tomas Holes (C)",club:"Slavia Praha",pos:"CB"},{name:"Jan Boril",club:"Slavia Praha",pos:"LB"},{name:"Ladislav Krejci",club:"Sparta Praha",pos:"CM"},{name:"David Jurasek",club:"Benfica",pos:"CM"},{name:"Ondrej Lingr",club:"Feyenoord",pos:"RW"},{name:"Tomas Soucek",club:"West Ham",pos:"AM"},{name:"Adam Hlozek",club:"Bayer Leverkusen",pos:"LW"},{name:"Patrik Schick",club:"Bayer Leverkusen",pos:"ST"}]},
  // ── GROUP B ──────────────────────────────────────────────────────────────
  CAN:{formation:"4-3-3",confirmed:true,narrative:"Co-hosts Canada arrived at their home World Cup with Jesse Marsch's young squad and Alphonso Davies as captain. Jonathan David leads the attack after his prolific season in Serie A.",
    xi:[{name:"Maxime Crepeau",club:"Orlando City",pos:"GK"},{name:"Alistair Johnston",club:"Celtic",pos:"RB"},{name:"Derek Cornelius",club:"Panathinaikos",pos:"CB"},{name:"Steven Vitoria",club:"Moreirense",pos:"CB"},{name:"Alphonso Davies (C)",club:"Bayern Munich",pos:"LB"},{name:"Stephen Eustaquio",club:"Porto",pos:"CM"},{name:"Ismail Kone",club:"Marseille",pos:"CM"},{name:"Tajon Buchanan",club:"Club Brugge",pos:"RW"},{name:"Liam Millar",club:"Basel",pos:"AM"},{name:"Richie Laryea",club:"Nottm Forest",pos:"LW"},{name:"Jonathan David",club:"Juventus",pos:"ST"}]},
  SUI:{formation:"4-2-3-1",confirmed:true,narrative:"Switzerland have made the knockouts in four straight tournaments and arrive again as the kind of disciplined, hard-to-beat side nobody wants to face. Granit Xhaka leads from midfield after a surprise move to Sunderland.",
    xi:[{name:"Gregor Kobel",club:"Borussia Dortmund",pos:"GK"},{name:"Silvan Widmer",club:"Mainz",pos:"RB"},{name:"Nico Elvedi",club:"M'gladbach",pos:"CB"},{name:"Manuel Akanji",club:"Inter Milan",pos:"CB"},{name:"Ricardo Rodriguez",club:"Real Betis",pos:"LB"},{name:"Granit Xhaka (C)",club:"Sunderland",pos:"CM"},{name:"Remo Freuler",club:"Bologna",pos:"CM"},{name:"Dan Ndoye",club:"Bologna",pos:"RW"},{name:"Fabian Rieder",club:"Rennes",pos:"AM"},{name:"Breel Embolo",club:"Monaco",pos:"LW"},{name:"Zeki Amdouni",club:"Burnley",pos:"ST"}]},
  QAT:{formation:"4-2-3-1",confirmed:true,narrative:"Qatar arrive under coach Julen Lopetegui making only their second World Cup appearance, this time on foreign soil. Akram Afif, the 2023 Asian Player of the Year, leads the attack.",
    xi:[{name:"Meshaal Barsham",club:"Al Sadd",pos:"GK"},{name:"Pedro Miguel",club:"Al Duhail",pos:"RB"},{name:"Boualem Khoukhi",club:"Al Sadd",pos:"CB"},{name:"Bassam Al Rawi",club:"Al Sadd",pos:"CB"},{name:"Homam Al Amin",club:"Al Sadd",pos:"LB"},{name:"Karim Boudiaf",club:"Al Duhail",pos:"CM"},{name:"Abdulaziz Hatem",club:"Al Rayyan",pos:"CM"},{name:"Almoez Ali",club:"Al Duhail",pos:"RW"},{name:"Hassan Al Haydos (C)",club:"Al Sadd",pos:"AM"},{name:"Akram Afif",club:"Al Sadd",pos:"LW"},{name:"Mohammed Muntari",club:"Al Duhail",pos:"ST"}]},
  BIH:{formation:"4-2-3-1",confirmed:true,narrative:"Bosnia & Herzegovina knocked out Italy on penalties in the playoff final — the biggest shock on the road to North America. Captain Edin Dzeko leads the line at what is almost certainly his last World Cup.",
    xi:[{name:"Nikola Vasilj",club:"St. Pauli",pos:"GK"},{name:"Sead Kolasinac",club:"Atalanta",pos:"LB"},{name:"Ermin Bicakcic",club:"Nuremberg",pos:"CB"},{name:"Denis Mahmutovic",club:"Stuttgart",pos:"CB"},{name:"Muhamed Hadzic",club:"Vitesse",pos:"RB"},{name:"Miralem Pjanic",club:"Sharjah",pos:"CM"},{name:"Sasa Lukic",club:"Fulham",pos:"CM"},{name:"Amer Gojak",club:"Dinamo Zagreb",pos:"RW"},{name:"Haris Hajradinovic",club:"Rakow Czestochowa",pos:"AM"},{name:"Sasa Kalajdzic",club:"Wolves",pos:"LW"},{name:"Edin Dzeko (C)",club:"Fenerbahce",pos:"ST"}]},
  // ── GROUP C ──────────────────────────────────────────────────────────────
  BRA:{formation:"4-2-3-1",confirmed:true,narrative:"Brazil arrive under Carlo Ancelotti chasing a record sixth title, missing Rodrygo and Raphinha to injury but still stacked with the most fearsome front line in the tournament.",
    xi:[{name:"Alisson",club:"Liverpool",pos:"GK"},{name:"Danilo",club:"Juventus",pos:"RB"},{name:"Marquinhos",club:"PSG",pos:"CB"},{name:"Gabriel Magalhaes",club:"Arsenal",pos:"CB"},{name:"Guilherme Arana",club:"Atletico Mineiro",pos:"LB"},{name:"Bruno Guimaraes",club:"Newcastle",pos:"CM"},{name:"Casemiro",club:"Man Utd",pos:"CM"},{name:"Savinho",club:"Man City",pos:"RW"},{name:"Lucas Paqueta",club:"West Ham",pos:"AM"},{name:"Vinicius Junior (C)",club:"Real Madrid",pos:"LW"},{name:"Endrick",club:"Real Madrid",pos:"ST"}]},
  MAR:{formation:"4-2-3-1",confirmed:true,narrative:"Morocco are still the standard the rest of CAF chases after their 2022 semifinal heroics. Under coach Mohamed Ouahbi, Achraf Hakimi captains a side built on elite pressing and world-class width.",
    xi:[{name:"Yassine Bounou",club:"Al-Hilal",pos:"GK"},{name:"Achraf Hakimi (C)",club:"PSG",pos:"RB"},{name:"Chadi Riad",club:"Crystal Palace",pos:"CB"},{name:"Issa Diop",club:"Fulham",pos:"CB"},{name:"Noussair Mazraoui",club:"Man Utd",pos:"LB"},{name:"Neil El Aynaoui",club:"Lens",pos:"CM"},{name:"Ayyoub Bouaddi",club:"Lille",pos:"CM"},{name:"Bilal El Khannouss",club:"Leicester",pos:"RW"},{name:"Hakim Ziyech",club:"Galatasaray",pos:"AM"},{name:"Youssef En-Nesyri",club:"Fenerbahce",pos:"LW"},{name:"Ayoub El Kaabi",club:"Olimpija Ljubljana",pos:"ST"}]},
  SCO:{formation:"4-3-3",confirmed:true,narrative:"Scotland are back after a 28-year wait under Steve Clarke, having never once escaped a World Cup group stage. Andy Robertson, now at Tottenham, leads a squad that believes this golden generation can finally end that curse.",
    xi:[{name:"Craig Gordon",club:"Hearts",pos:"GK"},{name:"Nathan Patterson",club:"Everton",pos:"RB"},{name:"Jack Hendry",club:"Al-Ettifaq",pos:"CB"},{name:"Scott McKenna",club:"Dinamo Zagreb",pos:"CB"},{name:"Andy Robertson (C)",club:"Tottenham",pos:"LB"},{name:"Lewis Ferguson",club:"Bologna",pos:"CM"},{name:"Scott McTominay",club:"Napoli",pos:"CM"},{name:"Ryan Christie",club:"Bournemouth",pos:"CM"},{name:"Ben Doak",club:"Liverpool",pos:"RW"},{name:"John McGinn",club:"Aston Villa",pos:"AM"},{name:"Lyndon Dykes",club:"QPR",pos:"ST"}]},
  HAI:{formation:"4-4-2",confirmed:true,narrative:"Haiti return after 52 years away, making their World Cup comeback under coach Sébastien Migné. The Grenadiers qualified through CONCACAF in one of the best stories of the road to North America.",
    xi:[{name:"Johny Placide (C)",club:"Clermont",pos:"GK"},{name:"Jean-Kevin Duverne",club:"Lausanne-Sport",pos:"RB"},{name:"Carlens Arcus",club:"Angers",pos:"CB"},{name:"Hannes Delcroix",club:"Anderlecht",pos:"CB"},{name:"Duke Lacroix",club:"Columbus Crew",pos:"LB"},{name:"Duckens Nazon",club:"FC Lausanne",pos:"RM"},{name:"Frantzdy Pierrot",club:"New England Rev",pos:"CM"},{name:"Steeven Saba",club:"Le Havre",pos:"CM"},{name:"Derrick Etienne Jr.",club:"Colorado Rapids",pos:"LM"},{name:"Kevin Lafrance",club:"Randers",pos:"ST"},{name:"Garven Metusala",club:"Troyes",pos:"ST"}]},
  // ── GROUP D ──────────────────────────────────────────────────────────────
  USA:{formation:"4-3-3",confirmed:true,narrative:"Co-hosts the United States field the deepest golden generation the program has produced, still chasing a result to top their 1930 semifinal. Christian Pulisic and Folarin Balogun lead the attack.",
    xi:[{name:"Matt Turner",club:"Crystal Palace",pos:"GK"},{name:"Sergino Dest",club:"PSV",pos:"RB"},{name:"Chris Richards",club:"Crystal Palace",pos:"CB"},{name:"Tim Ream",club:"Charlotte FC",pos:"CB"},{name:"Antonee Robinson",club:"Fulham",pos:"LB"},{name:"Tyler Adams (C)",club:"Bournemouth",pos:"CM"},{name:"Weston McKennie",club:"Juventus",pos:"CM"},{name:"Yunus Musah",club:"AC Milan",pos:"CM"},{name:"Christian Pulisic",club:"AC Milan",pos:"RW"},{name:"Gio Reyna",club:"Nottm Forest",pos:"LW"},{name:"Folarin Balogun",club:"AS Monaco",pos:"ST"}]},
  PAR:{formation:"4-4-2",confirmed:true,narrative:"Paraguay are back at a World Cup for the first time since 2010, under coach Gustavo Alfaro. La Albirroja are one of the most defensively stubborn sides in the tournament, with Miguel Almiron the creative spark.",
    xi:[{name:"Carlos Coronel",club:"NY Red Bulls",pos:"GK"},{name:"Juan Caceres",club:"Athletico Paranaense",pos:"RB"},{name:"Gustavo Gomez (C)",club:"Atletico Mineiro",pos:"CB"},{name:"Omar Alderete",club:"Getafe",pos:"CB"},{name:"Santiago Arzamendia",club:"Cadiz",pos:"LB"},{name:"Mathias Villasanti",club:"Gremio",pos:"RM"},{name:"Andres Cubas",club:"Lens",pos:"CM"},{name:"Richard Sanchez",club:"Club America",pos:"CM"},{name:"Miguel Almiron",club:"MLS",pos:"LM"},{name:"Adam Bareiro",club:"San Lorenzo",pos:"ST"},{name:"Antonio Sanabria",club:"Torino",pos:"ST"}]},
  AUS:{formation:"4-4-2",confirmed:true,narrative:"The Socceroos arrive under Tony Popovic with captain Mathew Ryan in goal. Australia have made the round of 16 in two of the last five tournaments and believe this squad can finally break through.",
    xi:[{name:"Mathew Ryan (C)",club:"Levante",pos:"GK"},{name:"Nathaniel Atkinson",club:"Hearts",pos:"RB"},{name:"Harry Souttar",club:"Leicester",pos:"CB"},{name:"Kye Rowles",club:"Hearts",pos:"CB"},{name:"Aziz Behich",club:"Dundee Utd",pos:"LB"},{name:"Connor Metcalfe",club:"St. Pauli",pos:"RM"},{name:"Jackson Irvine",club:"St. Pauli",pos:"CM"},{name:"Riley McGree",club:"Charlotte FC",pos:"CM"},{name:"Lachie Wales",club:"Hiroshima",pos:"LM"},{name:"Mitchell Duke",club:"Al-Tai",pos:"ST"},{name:"Jamie Maclaren",club:"Melbourne City",pos:"ST"}]},
  TUR:{formation:"4-2-3-1",confirmed:true,narrative:"Turkiye arrive under Vincenzo Montella with captain Hakan Calhanoglu orchestrating from deep and Arda Guler providing the flair — the most exciting Turkish side in a generation.",
    xi:[{name:"Altay Bayindir",club:"Man Utd",pos:"GK"},{name:"Ferdi Kadioglu",club:"Brighton",pos:"RB"},{name:"Abdulkerim Bardakci",club:"Galatasaray",pos:"CB"},{name:"Caglar Soyuncu",club:"Fenerbahce",pos:"CB"},{name:"Mert Muldur",club:"Union Berlin",pos:"LB"},{name:"Hakan Calhanoglu (C)",club:"Inter Milan",pos:"CM"},{name:"Salih Ozcan",club:"Borussia Dortmund",pos:"CM"},{name:"Kerem Akturkoglu",club:"Galatasaray",pos:"RW"},{name:"Arda Guler",club:"Real Madrid",pos:"AM"},{name:"Baris Alper Yilmaz",club:"Galatasaray",pos:"LW"},{name:"Cenk Tosun",club:"Besiktas",pos:"ST"}]},
  // ── GROUP E ──────────────────────────────────────────────────────────────
  GER:{formation:"4-2-3-1",confirmed:true,narrative:"Germany are four-time champions desperate to shake off back-to-back group-stage exits in 2018 and 2022. Florian Wirtz and Jamal Musiala form the most exciting midfield partnership in world football.",
    xi:[{name:"Manuel Neuer",club:"Bayern Munich",pos:"GK"},{name:"Benjamin Henrichs",club:"RB Leipzig",pos:"RB"},{name:"Antonio Rudiger",club:"Real Madrid",pos:"CB"},{name:"Jonathan Tah",club:"Bayer Leverkusen",pos:"CB"},{name:"Maximilian Mittelstadt",club:"Stuttgart",pos:"LB"},{name:"Joshua Kimmich (C)",club:"Bayern Munich",pos:"CM"},{name:"Robert Andrich",club:"Bayer Leverkusen",pos:"CM"},{name:"Leroy Sane",club:"Bayern Munich",pos:"RW"},{name:"Jamal Musiala",club:"Bayern Munich",pos:"AM"},{name:"Florian Wirtz",club:"Liverpool",pos:"LW"},{name:"Niclas Fullkrug",club:"West Ham",pos:"ST"}]},
  ECU:{formation:"4-2-3-1",confirmed:true,narrative:"Ecuador arrive under coach Sebastian Beccacece with Moisés Caicedo anchoring one of the best midfields in South America. Piero Hincapie at Arsenal and Willian Pacho at PSG give them a world-class defensive core.",
    xi:[{name:"Moises Ramirez",club:"Independiente del Valle",pos:"GK"},{name:"Angelo Preciado",club:"Genk",pos:"RB"},{name:"Piero Hincapie",club:"Arsenal",pos:"CB"},{name:"Willian Pacho",club:"PSG",pos:"CB"},{name:"Pervis Estupinian",club:"Brighton",pos:"LB"},{name:"Moises Caicedo",club:"Chelsea",pos:"CM"},{name:"Alan Minda",club:"Metalist",pos:"CM"},{name:"Jeremy Sarmiento",club:"Brighton",pos:"RW"},{name:"Gonzalo Plata",club:"Al Qadsiah",pos:"AM"},{name:"Kevin Rodriguez",club:"Ipswich",pos:"LW"},{name:"Enner Valencia (C)",club:"Internacional",pos:"ST"}]},
  CIV:{formation:"4-3-3",confirmed:true,narrative:"Ivory Coast arrive as reigning African champions under coach Emerse Faé. A formidable defensive spine featuring Ousmane Diomande, Evan N'Dicka, and Odilon Kossounou makes them one of the hardest sides to beat.",
    xi:[{name:"Yahia Fofana",club:"Rizespor",pos:"GK"},{name:"Wilfried Singo",club:"Monaco",pos:"RB"},{name:"Odilon Kossounou",club:"Atalanta",pos:"CB"},{name:"Ousmane Diomande",club:"Sporting CP",pos:"CB"},{name:"Evan N'Dicka",club:"Roma",pos:"LB"},{name:"Seko Fofana (C)",club:"Al Qadsiah",pos:"CM"},{name:"Ibrahim Sangare",club:"Nottm Forest",pos:"CM"},{name:"Franck Kessie",club:"Al-Ahli",pos:"CM"},{name:"Simon Adingra",club:"Brighton",pos:"RW"},{name:"Nicolas Pepe",club:"Trabzonspor",pos:"LW"},{name:"Sebastien Haller",club:"Leganes",pos:"ST"}]},
  CUW:{formation:"4-4-2",confirmed:true,narrative:"Curacao make their first-ever World Cup appearance under Dutch legend Dick Advocaat. A nation of 156,000 people who produced Xander Bogaerts and plenty of Eredivisie talent — the ultimate underdog story of 2026.",
    xi:[{name:"Eloy Room",club:"FC Cincinnati",pos:"GK"},{name:"Riechedly Bazoer",club:"Vitesse",pos:"RB"},{name:"Cuco Martina",club:"Wigan",pos:"CB"},{name:"Roshon van Eijma",club:"Jong AZ",pos:"CB"},{name:"Joshua Brenet",club:"FC Utrecht",pos:"LB"},{name:"Juninho",club:"Cruz Azul",pos:"RM"},{name:"Leandro Bacuna (C)",club:"Rangers",pos:"CM"},{name:"Rurickson Liberia",club:"Jong PSV",pos:"CM"},{name:"Chedrick Akolo",club:"Huddersfield",pos:"LM"},{name:"Jarchinio Antonia",club:"Antalyaspor",pos:"ST"},{name:"Rangelo Janga",club:"FC Emmen",pos:"ST"}]},
  // ── GROUP F ──────────────────────────────────────────────────────────────
  NED:{formation:"4-3-3",confirmed:true,narrative:"The Netherlands are three-time World Cup runners-up and still searching for their first title. Virgil van Dijk captains a side with genuine title credentials, built around the De Jong–van Dijk axis and Gakpo's electric form.",
    xi:[{name:"Bart Verbruggen",club:"Brighton",pos:"GK"},{name:"Denzel Dumfries",club:"Inter Milan",pos:"RB"},{name:"Stefan de Vrij",club:"Inter Milan",pos:"CB"},{name:"Virgil van Dijk (C)",club:"Liverpool",pos:"CB"},{name:"Matthijs de Ligt",club:"Man Utd",pos:"LB"},{name:"Frenkie de Jong",club:"Barcelona",pos:"CM"},{name:"Tijjani Reijnders",club:"AC Milan",pos:"CM"},{name:"Xavi Simons",club:"RB Leipzig",pos:"CM"},{name:"Donyell Malen",club:"Dortmund",pos:"RW"},{name:"Cody Gakpo",club:"Liverpool",pos:"LW"},{name:"Memphis Depay",club:"Atletico Madrid",pos:"ST"}]},
  JPN:{formation:"4-2-3-1",confirmed:true,narrative:"Japan have reached the round of 16 in four straight tournaments without ever breaking through. This is their most talented squad yet — Kaoru Mitoma and Takefusa Kubo give them wings, while Ayase Ueda leads the line.",
    xi:[{name:"Zion Suzuki",club:"Club Brugge",pos:"GK"},{name:"Hiroki Sugawara",club:"AZ Alkmaar",pos:"RB"},{name:"Takehiro Tomiyasu",club:"Arsenal",pos:"CB"},{name:"Ko Itakura",club:"Borussia M'gladbach",pos:"CB"},{name:"Yuto Nagatomo",club:"Vissel Kobe",pos:"LB"},{name:"Wataru Endo",club:"Liverpool",pos:"CM"},{name:"Ao Tanaka",club:"Dortmund",pos:"CM"},{name:"Kaoru Mitoma",club:"Brighton",pos:"RW"},{name:"Daichi Kamada",club:"Lazio",pos:"AM"},{name:"Takefusa Kubo",club:"Real Sociedad",pos:"LW"},{name:"Ayase Ueda",club:"Bournemouth",pos:"ST"}]},
  TUN:{formation:"4-3-3",confirmed:true,narrative:"Tunisia are at a seventh World Cup under coach Sabri Lamouchi still searching for a first knockout-stage win. Ali Abdi and Montassar Talbi bring European quality; Naim Sliti leads the attack.",
    xi:[{name:"Aymen Dahmen",club:"CS Sfaxien",pos:"GK"},{name:"Ali Abdi",club:"Nice",pos:"RB"},{name:"Montassar Talbi",club:"Lorient",pos:"CB"},{name:"Omar Rekik",club:"Maribor",pos:"CB"},{name:"Dylan Bronn",club:"Salernitana",pos:"LB"},{name:"Ellyes Skhiri",club:"Frankfurt",pos:"CM"},{name:"Anis Ben Slimane",club:"Brondby",pos:"CM"},{name:"Wahbi Khazri",club:"Montpellier",pos:"CM"},{name:"Wajdi Kechrida",club:"Antalyaspor",pos:"RW"},{name:"Naim Sliti (C)",club:"Angers",pos:"LW"},{name:"Issam Jebali",club:"Bordeaux",pos:"ST"}]},
  SWE:{formation:"4-3-3",confirmed:true,narrative:"Sweden are back at a World Cup for the first time since 2018 under Graham Potter. With both Alexander Isak and Viktor Gyokeres in attack, they may have the most potent striking partnership in the tournament.",
    xi:[{name:"Jacob Widell Zetterstrom",club:"Bayer Leverkusen",pos:"GK"},{name:"Emil Krafth",club:"Newcastle",pos:"RB"},{name:"Isak Hien",club:"Atalanta",pos:"CB"},{name:"Victor Lindelof (C)",club:"Aston Villa",pos:"CB"},{name:"Gabriel Gudmundsson",club:"Lille",pos:"LB"},{name:"Albin Ekdal",club:"Spezia",pos:"CM"},{name:"Dejan Kulusevski",club:"Tottenham",pos:"CM"},{name:"Kristoffer Olsson",club:"M'gladbach",pos:"CM"},{name:"Samuel Chukwueze",club:"AC Milan",pos:"RW"},{name:"Alexander Isak",club:"Liverpool",pos:"ST"},{name:"Viktor Gyokeres",club:"Arsenal",pos:"LW"}]},
  // ── GROUP G ──────────────────────────────────────────────────────────────
  BEL:{formation:"4-2-3-1",confirmed:true,narrative:"Belgium's golden generation makes what may be its last stand under coach Rudi Garcia. Thibaut Courtois returns in goal and Youri Tielemans captains, with De Bruyne and Lukaku still the headline act.",
    xi:[{name:"Thibaut Courtois",club:"Real Madrid",pos:"GK"},{name:"Thomas Meunier",club:"Lille",pos:"RB"},{name:"Wout Faes",club:"Leicester",pos:"CB"},{name:"Arthur Theate",club:"Frankfurt",pos:"CB"},{name:"Timothy Castagne",club:"Fulham",pos:"LB"},{name:"Youri Tielemans (C)",club:"Aston Villa",pos:"CM"},{name:"Amadou Onana",club:"Aston Villa",pos:"CM"},{name:"Jeremy Doku",club:"Man City",pos:"RW"},{name:"Kevin De Bruyne",club:"Napoli",pos:"AM"},{name:"Leandro Trossard",club:"Arsenal",pos:"LW"},{name:"Romelu Lukaku",club:"Napoli",pos:"ST"}]},
  IRN:{formation:"4-2-3-1",confirmed:true,narrative:"Iran arrive at a seventh World Cup under coach Amir Ghalenoei, still without a knockout-stage win. Mehdi Taremi at Inter Milan is their star — a complete striker whose link-up play elevates everyone around him.",
    xi:[{name:"Alireza Beiranvand",club:"Tractor",pos:"GK"},{name:"Mohammad Mohebi",club:"Persepolis",pos:"RB"},{name:"Shojae Khalilzadeh",club:"Al-Ahli",pos:"CB"},{name:"Majid Hosseini",club:"Kasimpasa",pos:"CB"},{name:"Ehsan Hajsafi (C)",club:"Panathinaikos",pos:"LB"},{name:"Ahmad Nourollahi",club:"Sepahan",pos:"CM"},{name:"Saeid Ezatolahi",club:"Celta Vigo",pos:"CM"},{name:"Alireza Jahanbakhsh",club:"Feyenoord",pos:"RW"},{name:"Ali Gholizadeh",club:"Charleroi",pos:"AM"},{name:"Sardar Azmoun",club:"Lyon",pos:"LW"},{name:"Mehdi Taremi",club:"Inter Milan",pos:"ST"}]},
  EGY:{formation:"4-3-3",confirmed:true,narrative:"Egypt are back under coach Hossam Hassan with Mohamed Salah, who finally has a World Cup to show what he can do on the biggest stage. El-Shenawy in goal and a rock-solid defensive setup give them a genuine chance.",
    xi:[{name:"Mohamed El Shenawy",club:"Al-Ahly",pos:"GK"},{name:"Ahmed Hegazi",club:"Al-Ittihad",pos:"RB"},{name:"Mohamed Abdelmonem",club:"Al-Ahly",pos:"CB"},{name:"Yasser Ibrahim",club:"Al-Ahly",pos:"CB"},{name:"Omar Kamal",club:"Zamalek",pos:"LB"},{name:"Tarek Hamed",club:"Sharjah",pos:"CM"},{name:"Mohamed Elneny (C)",club:"Besiktas",pos:"CM"},{name:"Emam Ashour",club:"Al-Ahly",pos:"CM"},{name:"Mostafa Mohamed",club:"Nantes",pos:"RW"},{name:"Amr El Sulaya",club:"Al-Ahly",pos:"LW"},{name:"Mohamed Salah",club:"Liverpool",pos:"ST"}]},
  NZL:{formation:"4-4-2",confirmed:true,narrative:"New Zealand make their fifth World Cup appearance under coach Darren Bazeley — the first time the All Whites have qualified without needing an intercontinental playoff. Captain Max Crocombe leads a spirited underdog.",
    xi:[{name:"Max Crocombe",club:"Millwall",pos:"GK"},{name:"Tim Payne",club:"Wellington Phoenix",pos:"RB"},{name:"Liberato Cacace",club:"Empoli",pos:"CB"},{name:"Winston Reid",club:"Brentford",pos:"CB"},{name:"Nando de Wagt",club:"VVV-Venlo",pos:"LB"},{name:"Joe Bell",club:"Middlesbrough",pos:"RM"},{name:"Marco Rojas",club:"Melbourne City",pos:"CM"},{name:"Clayton Lewis",club:"Sint-Truiden",pos:"CM"},{name:"Matthew Garbett",club:"Panathinaikos",pos:"LM"},{name:"Chris Wood (C)",club:"Nottm Forest",pos:"ST"},{name:"Hamish Watson",club:"Wellington Phoenix",pos:"ST"}]},
  // ── GROUP H ──────────────────────────────────────────────────────────────
  ESP:{formation:"4-3-3",confirmed:true,narrative:"Spain enter as reigning European champions and World Cup favorites with a squad so Barcelona-heavy that no Real Madrid player made the final 26. Lamine Yamal and Nico Williams form the most exciting wing partnership in the world.",
    xi:[{name:"Unai Simon",club:"Athletic Club",pos:"GK"},{name:"Pedro Porro",club:"Tottenham",pos:"RB"},{name:"Pau Cubarsi",club:"Barcelona",pos:"CB"},{name:"Aymeric Laporte",club:"Athletic Club",pos:"CB"},{name:"Marc Cucurella",club:"Chelsea",pos:"LB"},{name:"Rodri (C)",club:"Man City",pos:"CM"},{name:"Pedri",club:"Barcelona",pos:"CM"},{name:"Martin Zubimendi",club:"Arsenal",pos:"CM"},{name:"Lamine Yamal",club:"Barcelona",pos:"RW"},{name:"Nico Williams",club:"Athletic Club",pos:"LW"},{name:"Mikel Oyarzabal",club:"Real Sociedad",pos:"ST"}]},
  URU:{formation:"4-3-3",confirmed:true,narrative:"Uruguay arrive under Marcelo Bielsa, the perfectionist coach who has reinvigorated La Celeste. Gimenez captains, Valverde and Bentancur drive the midfield, and Darwin Nunez leads the line after his move to Al-Hilal.",
    xi:[{name:"Santiago Mele",club:"Junior",pos:"GK"},{name:"Guillermo Varela",club:"Flamengo",pos:"RB"},{name:"Jose Maria Gimenez (C)",club:"Atletico Madrid",pos:"CB"},{name:"Ronald Araujo",club:"Barcelona",pos:"CB"},{name:"Mathias Olivera",club:"Napoli",pos:"LB"},{name:"Federico Valverde",club:"Real Madrid",pos:"CM"},{name:"Manuel Ugarte",club:"Man Utd",pos:"CM"},{name:"Rodrigo Bentancur",club:"Tottenham",pos:"CM"},{name:"Facundo Pellistri",club:"Man Utd",pos:"RW"},{name:"Darwin Nunez",club:"Al-Hilal",pos:"ST"},{name:"Maximiliano Araujo",club:"Sporting CP",pos:"LW"}]},
  KSA:{formation:"4-2-3-1",confirmed:true,narrative:"Saudi Arabia arrive under Greek coach Georgios Donis with Salem Al-Dawsari as captain on his third World Cup. Built almost entirely on Saudi Pro League players — 25 of 26 domestic — with Saud Abdulhamid the only European export.",
    xi:[{name:"Nawaf Al-Aqidi",club:"Al Nassr",pos:"GK"},{name:"Saud Abdulhamid",club:"Lens",pos:"RB"},{name:"Ali Al-Bulaihi",club:"Al Hilal",pos:"CB"},{name:"Abdulelah Al-Amri",club:"Al Qadsiah",pos:"CB"},{name:"Yasir Al-Shahrani",club:"Al Hilal",pos:"LB"},{name:"Ali Al-Hassan",club:"Al Ahli",pos:"CM"},{name:"Sami Al-Najei",club:"Al Shabab",pos:"CM"},{name:"Firas Al-Buraikan",club:"Al Ahli",pos:"RW"},{name:"Nasser Al-Dawsari",club:"Al Hilal",pos:"AM"},{name:"Salem Al-Dawsari (C)",club:"Al Hilal",pos:"LW"},{name:"Saleh Al-Shehri",club:"Al Hilal",pos:"ST"}]},
  CPV:{formation:"4-4-2",confirmed:true,narrative:"Cape Verde make their historic World Cup debut under coach Pedro 'Bubista' Brito, CAF Coach of the Year in 2025. With a population of 525,000, they are among the smallest nations ever to qualify for the World Cup.",
    xi:[{name:"Vozinha (C)",club:"Estoril",pos:"GK"},{name:"Steven Moreira",club:"Toulouse",pos:"RB"},{name:"Logan Costa",club:"Toulouse",pos:"CB"},{name:"Diney Borges",club:"Dinamo Zagreb",pos:"CB"},{name:"Stopira",club:"Rayo Vallecano",pos:"LB"},{name:"Amilton Tenreiro",club:"Benfica B",pos:"RM"},{name:"Enrique Andrade",club:"Maccabi Tel Aviv",pos:"CM"},{name:"Ryan Mendes",club:"Valenciennes",pos:"CM"},{name:"Garry Rodrigues",club:"Galatasaray",pos:"LM"},{name:"Julio Tavares",club:"Dijon",pos:"ST"},{name:"Willy Semedo",club:"Deportivo Alaves",pos:"ST"}]},
  // ── GROUP I ──────────────────────────────────────────────────────────────
  FRA:{formation:"4-3-3",confirmed:true,narrative:"France enter ranked first in the world and chasing a third star, with Didier Deschamps coaching his final tournament and Kylian Mbappe one goal off the country's all-time scoring record.",
    xi:[{name:"Mike Maignan",club:"AC Milan",pos:"GK"},{name:"Jules Kounde",club:"Barcelona",pos:"RB"},{name:"William Saliba",club:"Arsenal",pos:"CB"},{name:"Dayot Upamecano",club:"Bayern Munich",pos:"CB"},{name:"Theo Hernandez",club:"Al-Hilal",pos:"LB"},{name:"Aurelien Tchouameni",club:"Real Madrid",pos:"CM"},{name:"Warren Zaire-Emery",club:"PSG",pos:"CM"},{name:"Adrien Rabiot",club:"AC Milan",pos:"CM"},{name:"Ousmane Dembele",club:"PSG",pos:"RW"},{name:"Michael Olise",club:"Bayern Munich",pos:"LW"},{name:"Kylian Mbappe (C)",club:"Real Madrid",pos:"ST"}]},
  SEN:{formation:"4-3-3",confirmed:true,narrative:"Senegal arrive under coach Pape Thiaw as reigning African champions, 24 years after stunning holders France in 2002. Now they face France again — and this time Kalidou Koulibaly leads a squad with genuine knockout-stage credentials.",
    xi:[{name:"Edouard Mendy",club:"Al-Ahli",pos:"GK"},{name:"Krepin Diatta",club:"Monaco",pos:"RB"},{name:"Kalidou Koulibaly (C)",club:"Al-Hilal",pos:"CB"},{name:"Abdou Diallo",club:"RB Leipzig",pos:"CB"},{name:"Ismail Jakobs",club:"Monaco",pos:"LB"},{name:"Pape Matar Sarr",club:"Tottenham",pos:"CM"},{name:"Nampalys Mendy",club:"Free agent",pos:"CM"},{name:"Lamine Camara",club:"Monaco",pos:"CM"},{name:"Ismaila Sarr",club:"Crystal Palace",pos:"RW"},{name:"Sadio Mane",club:"Al-Nassr",pos:"LW"},{name:"Nicolas Jackson",club:"Chelsea",pos:"ST"}]},
  NOR:{formation:"4-3-3",confirmed:true,narrative:"Norway are back at a World Cup for the first time since 1998, finally built around a striker who has never played at a major tournament. The whole world wants to see what Erling Haaland can do on this stage.",
    xi:[{name:"Orjan Nyland",club:"Sevilla",pos:"GK"},{name:"Julian Ryerson",club:"Borussia Dortmund",pos:"RB"},{name:"Kristoffer Ajer",club:"Brentford",pos:"CB"},{name:"Torbjorn Heggem",club:"Bologna",pos:"CB"},{name:"David Moller Wolfe",club:"Wolverhampton",pos:"LB"},{name:"Martin Odegaard (C)",club:"Arsenal",pos:"CM"},{name:"Sander Berge",club:"Fulham",pos:"CM"},{name:"Kristian Thorstvedt",club:"Sassuolo",pos:"CM"},{name:"Alexander Sorloth",club:"Atletico Madrid",pos:"RW"},{name:"Erling Haaland",club:"Man City",pos:"ST"},{name:"Antonio Nusa",club:"Club Brugge",pos:"LW"}]},
  IRQ:{formation:"4-3-3",confirmed:true,narrative:"Iraq ended a 40-year wait by beating Bolivia in the intercontinental playoff. Australian coach Graham Arnold — who took Australia to the 2022 round of 16 — now leads the Lions of Mesopotamia into the toughest group in the draw.",
    xi:[{name:"Jalal Hassan (C)",club:"Al-Zawraa",pos:"GK"},{name:"Manaf Younis",club:"Al-Shorta",pos:"RB"},{name:"Rebin Sulaka",club:"Hallescher FC",pos:"CB"},{name:"Akam Hashem",club:"Al-Zawraa",pos:"CB"},{name:"Layth Mohammed",club:"Naft Al-Basra",pos:"LB"},{name:"Amjed Attwan",club:"Sepahan",pos:"CM"},{name:"Hussein Ali",club:"Al-Shorta",pos:"CM"},{name:"Bassam Raad",club:"Al-Zawraa",pos:"CM"},{name:"Amir Al-Ammari",club:"Fehérvár",pos:"RW"},{name:"Aymen Hussein",club:"Al-Zawraa",pos:"ST"},{name:"Mohanad Ali",club:"Omonia",pos:"LW"}]},
  // ── GROUP J ──────────────────────────────────────────────────────────────
  ARG:{formation:"4-3-3",confirmed:true,narrative:"Defending champions chasing what no side has done since Brazil in 1962. Lionel Messi captains a record sixth and presumably final World Cup at 38, leading the deepest squad Argentina have ever assembled.",
    xi:[{name:"Emiliano Martinez",club:"Aston Villa",pos:"GK"},{name:"Nahuel Molina",club:"Atletico Madrid",pos:"RB"},{name:"Cristian Romero",club:"Tottenham",pos:"CB"},{name:"Nicolas Otamendi",club:"Benfica",pos:"CB"},{name:"Nicolas Tagliafico",club:"Lyon",pos:"LB"},{name:"Rodrigo De Paul",club:"Inter Miami",pos:"CM"},{name:"Enzo Fernandez",club:"Chelsea",pos:"CM"},{name:"Alexis Mac Allister",club:"Liverpool",pos:"CM"},{name:"Julian Alvarez",club:"Atletico Madrid",pos:"RW"},{name:"Lautaro Martinez",club:"Inter Milan",pos:"ST"},{name:"Lionel Messi (C)",club:"Inter Miami",pos:"LW"}]},
  AUT:{formation:"4-2-3-1",confirmed:true,narrative:"Austria won their UEFA qualifying group outright under Ralf Rangnick and arrive as one of the most dangerous unseeded sides. David Alaba, now 33, captains his most experienced Austrian squad ever.",
    xi:[{name:"Patrick Pentz",club:"Bayer Leverkusen",pos:"GK"},{name:"Stefan Posch",club:"Bologna",pos:"RB"},{name:"Kevin Danso",club:"Lens",pos:"CB"},{name:"David Alaba (C)",club:"Real Madrid",pos:"CB"},{name:"Philipp Mwene",club:"PSV",pos:"LB"},{name:"Nicolas Seiwald",club:"RB Leipzig",pos:"CM"},{name:"Christoph Baumgartner",club:"RB Leipzig",pos:"CM"},{name:"Florian Kainz",club:"FC Koln",pos:"RW"},{name:"Marcel Sabitzer",club:"Borussia Dortmund",pos:"AM"},{name:"Patrick Wimmer",club:"Wolfsburg",pos:"LW"},{name:"Michael Gregoritsch",club:"Freiburg",pos:"ST"}]},
  ALG:{formation:"4-3-3",confirmed:true,narrative:"Algeria return to the World Cup for the first time since 2014 under coach Vladimir Petkovic, captained by Riyad Mahrez. And the goalkeeper? None other than Luca Zidane — son of Zinedine — who earned his spot at Granada.",
    xi:[{name:"Luca Zidane",club:"Granada",pos:"GK"},{name:"Rafik Belghali",club:"Hellas Verona",pos:"RB"},{name:"Rayan Ait-Nouri",club:"Man City",pos:"CB"},{name:"Djamel Benlamri",club:"Lyon",pos:"CB"},{name:"Samir Chergui",club:"Paris FC",pos:"LB"},{name:"Ismail Bennacer",club:"AC Milan",pos:"CM"},{name:"Ramiz Zerrouki",club:"Feyenoord",pos:"CM"},{name:"Sofiane Feghouli",club:"Al-Ettifaq",pos:"CM"},{name:"Nassim Boujellab",club:"Schalke",pos:"RW"},{name:"Riyad Mahrez (C)",club:"Al-Ahli",pos:"LW"},{name:"Islam Slimani",club:"Antalyaspor",pos:"ST"}]},
  JOR:{formation:"4-2-3-1",confirmed:true,narrative:"Jordan make their historic World Cup debut under Moroccan coach Jamal Sellami, the first manager to take Jordan to the finals. A nation of 10 million making their maiden appearance against Argentina, Austria, and Algeria.",
    xi:[{name:"Yazeed Abulaila",club:"Al-Hussein",pos:"GK"},{name:"Mohammad Abualnadi",club:"Al-Wehdat",pos:"RB"},{name:"Yazan Al-Naimat",club:"Hapoel Be'er Sheva",pos:"CB"},{name:"Husam Abu Dahab",club:"Al-Faisaly",pos:"CB"},{name:"Ahmad Al-Sardia",club:"Al-Ramtha",pos:"LB"},{name:"Noor Al-Rawabdeh",club:"Al-Jazeera",pos:"CM"},{name:"Mohammad Al-Dmeiri",club:"Al-Wehdat",pos:"CM"},{name:"Baha Faisal",club:"Al-Wahdat",pos:"RW"},{name:"Musa Al-Tamari",club:"Montpellier",pos:"AM"},{name:"Ehsan Haddad (C)",club:"Al-Wahdat",pos:"LW"},{name:"Yazan Al-Arab",club:"Omonia",pos:"ST"}]},
  // ── GROUP K ──────────────────────────────────────────────────────────────
  POR:{formation:"4-3-3",confirmed:true,narrative:"Portugal arrive as reigning Nations League champions with Cristiano Ronaldo becoming the first man to play six World Cups, chasing the one prize that has always escaped him. The squad behind him has never been stronger.",
    xi:[{name:"Diogo Costa",club:"Porto",pos:"GK"},{name:"Diogo Dalot",club:"Man Utd",pos:"RB"},{name:"Ruben Dias",club:"Man City",pos:"CB"},{name:"Goncalo Inacio",club:"Sporting CP",pos:"CB"},{name:"Nuno Mendes",club:"PSG",pos:"LB"},{name:"Vitinha",club:"PSG",pos:"CM"},{name:"Joao Neves",club:"PSG",pos:"CM"},{name:"Bruno Fernandes",club:"Man Utd",pos:"CM"},{name:"Bernardo Silva",club:"Man City",pos:"RW"},{name:"Rafael Leao",club:"AC Milan",pos:"LW"},{name:"Cristiano Ronaldo (C)",club:"Al-Nassr",pos:"ST"}]},
  COL:{formation:"4-2-3-1",confirmed:true,narrative:"Colombia are back at a World Cup for the first time since 2018 under coach Nestor Lorenzo. Luis Diaz at Bayern Munich leads the attack; David Ospina comes out of international retirement to anchor the goal.",
    xi:[{name:"David Ospina",club:"Al-Qadsiah",pos:"GK"},{name:"Daniel Munoz",club:"Crystal Palace",pos:"RB"},{name:"Davinson Sanchez",club:"Galatasaray",pos:"CB"},{name:"Carlos Cuesta",club:"Genk",pos:"CB"},{name:"Johan Mojica",club:"Girona",pos:"LB"},{name:"Jefferson Lerma",club:"Crystal Palace",pos:"CM"},{name:"Jhon Arias",club:"Fluminense",pos:"CM"},{name:"Cucho Hernandez",club:"Columbus Crew",pos:"RW"},{name:"James Rodriguez",club:"Rayo Vallecano",pos:"AM"},{name:"Luis Diaz",club:"Bayern Munich",pos:"LW"},{name:"Falcao (C)",club:"Rayo Vallecano",pos:"ST"}]},
  UZB:{formation:"4-3-3",confirmed:true,narrative:"Uzbekistan reach their first World Cup under coach Fabio Cannavaro — yes, the 2006 World Cup-winning captain. Abdukodir Khusanov at Manchester City is their breakout star and a genuine world-class talent.",
    xi:[{name:"Eldor Shomurodov",club:"Roma",pos:"GK"},{name:"Jasur Yakhshiboev",club:"Navbahor",pos:"RB"},{name:"Abdukodir Khusanov",club:"Man City",pos:"CB"},{name:"Khojiakbar Alijonov",club:"Pakhtakor",pos:"CB"},{name:"Sherzod Nasrulloev",club:"Pakhtakor",pos:"LB"},{name:"Otabek Shukurov",club:"Pakhtakor",pos:"CM"},{name:"Jaloliddin Masharipov (C)",club:"Al-Faisaly",pos:"CM"},{name:"Nodir Tursunov",club:"Pakhtakor",pos:"CM"},{name:"Dostonbek Khamdamov",club:"Pakhtakor",pos:"RW"},{name:"Eldor Shomurodov",club:"Roma",pos:"ST"},{name:"Husayn Norchaev",club:"Navbahor",pos:"LW"}]},
  COD:{formation:"4-2-3-1",confirmed:true,narrative:"DR Congo return after 52 years away under coach Sébastien Desabre, with Chancel Mbemba leading from the back and Aaron Wan-Bissaka — now eligible for Congo — providing a huge Premier League upgrade at right back.",
    xi:[{name:"Joel Kiassumbua",club:"Toulouse",pos:"GK"},{name:"Aaron Wan-Bissaka",club:"West Ham",pos:"RB"},{name:"Chancel Mbemba (C)",club:"Lille",pos:"CB"},{name:"Axel Tuanzebe",club:"Burnley",pos:"CB"},{name:"Arthur Masuaku",club:"Lens",pos:"LB"},{name:"Yoane Wissa",club:"Brentford",pos:"CM"},{name:"Meschack Elia",club:"Young Boys",pos:"CM"},{name:"Paul-Jose Mpoku",club:"Panathinaikos",pos:"RW"},{name:"Cedric Bakambu",club:"Marseille",pos:"AM"},{name:"Dodi Lukebakio",club:"Sevilla",pos:"LW"},{name:"Ben Malango",club:"Al Hilal",pos:"ST"}]},
  // ── GROUP L ──────────────────────────────────────────────────────────────
  ENG:{formation:"4-2-3-1",confirmed:true,narrative:"England were the first European nation to qualify, conceding nothing across eight qualifying games. Harry Kane captains a third World Cup still chasing England's first title since 1966.",
    xi:[{name:"Jordan Pickford",club:"Everton",pos:"GK"},{name:"Reece James",club:"Chelsea",pos:"RB"},{name:"John Stones",club:"Man City",pos:"CB"},{name:"Marc Guehi",club:"Man City",pos:"CB"},{name:"Trevoh Chalobah",club:"Chelsea",pos:"LB"},{name:"Declan Rice",club:"Arsenal",pos:"CM"},{name:"Jude Bellingham",club:"Real Madrid",pos:"CM"},{name:"Bukayo Saka",club:"Arsenal",pos:"RW"},{name:"Eberechi Eze",club:"Arsenal",pos:"AM"},{name:"Morgan Rogers",club:"Aston Villa",pos:"LW"},{name:"Harry Kane (C)",club:"Bayern Munich",pos:"ST"}]},
  CRO:{formation:"4-2-3-1",confirmed:true,narrative:"Croatia are serial overachievers — 2018 runner-up and 2022 semifinalist — with Luka Modric, now at AC Milan at 40, named captain for what is certainly his last World Cup. Josko Gvardiol anchors the defence.",
    xi:[{name:"Dominik Livakovic",club:"Fenerbahce",pos:"GK"},{name:"Josip Stanisic",club:"Bayern Munich",pos:"RB"},{name:"Josip Sutalo",club:"Ajax",pos:"CB"},{name:"Duje Caleta-Car",club:"Southampton",pos:"CB"},{name:"Josko Gvardiol",club:"Man City",pos:"LB"},{name:"Luka Modric (C)",club:"AC Milan",pos:"CM"},{name:"Mateo Kovacic",club:"Man City",pos:"CM"},{name:"Lovro Majer",club:"Real Madrid",pos:"RW"},{name:"Andrej Kramaric",club:"Hoffenheim",pos:"AM"},{name:"Ivan Perisic",club:"Hajduk Split",pos:"LW"},{name:"Bruno Petkovic",club:"Dinamo Zagreb",pos:"ST"}]},
  PAN:{formation:"4-3-3",confirmed:true,narrative:"Panama arrive under Thomas Christiansen chasing their first-ever World Cup win. Their 2018 group-stage debut is still their only appearance — but this side is tighter and more experienced.",
    xi:[{name:"Orlando Mosquera",club:"Al-Fayha",pos:"GK"},{name:"Amir Murillo",club:"Besiktas",pos:"RB"},{name:"Eric Davis",club:"LD Alajuelense",pos:"CB"},{name:"Fidel Escobar",club:"New England Rev",pos:"CB"},{name:"Edgardo Farina",club:"Pari Nizhny Novgorod",pos:"LB"},{name:"Adalberto Carrasquilla",club:"Estudiantes",pos:"CM"},{name:"Anibal Godoy (C)",club:"San Diego FC",pos:"CM"},{name:"Jose Fajardo",club:"Nacional",pos:"CM"},{name:"Rolando Blackburn",club:"Al-Batin",pos:"RW"},{name:"Cecilio Waterman",club:"FC Juarez",pos:"LW"},{name:"Ivan Anderson",club:"CD Mafra",pos:"ST"}]},
  GHA:{formation:"4-3-3",confirmed:true,narrative:"Ghana arrive under Carlos Queiroz with a squad disrupted by injury — Mohammed Kudus was ruled out before the tournament — but Thomas Partey and Lawrence Ati-Zigi give them a backbone to build from.",
    xi:[{name:"Lawrence Ati-Zigi",club:"St. Gallen",pos:"GK"},{name:"Alidu Seidu",club:"Clermont",pos:"RB"},{name:"Abdul Mumin",club:"Valladolid",pos:"CB"},{name:"Alexander Djiku",club:"Strasbourg",pos:"CB"},{name:"Gideon Mensah",club:"Red Bull Salzburg",pos:"LB"},{name:"Thomas Partey (C)",club:"Villarreal",pos:"CM"},{name:"Mohammed Kudus",club:"West Ham",pos:"CM"},{name:"Elisha Owusu",club:"Gent",pos:"CM"},{name:"Antoine Semenyo",club:"Bournemouth",pos:"RW"},{name:"Inaki Williams",club:"Athletic Club",pos:"LW"},{name:"Jordan Ayew",club:"Leicester",pos:"ST"}]},
};

// Head coaches — taken from each team's narrative where named, otherwise the
// real 2026 national-team manager.
const COACHES: Record<string,string> = {
  MEX:"Javier Aguirre",KOR:"Hong Myung-bo",RSA:"Hugo Broos",CZE:"Miroslav Koubek",
  CAN:"Jesse Marsch",SUI:"Murat Yakin",QAT:"Julen Lopetegui",BIH:"Sergej Barbarez",
  BRA:"Carlo Ancelotti",MAR:"Mohamed Ouahbi",SCO:"Steve Clarke",HAI:"Sébastien Migné",
  USA:"Mauricio Pochettino",PAR:"Gustavo Alfaro",AUS:"Tony Popovic",TUR:"Vincenzo Montella",
  GER:"Julian Nagelsmann",ECU:"Sebastián Beccacece",CIV:"Emerse Faé",CUW:"Dick Advocaat",
  NED:"Ronald Koeman",JPN:"Hajime Moriyasu",TUN:"Sabri Lamouchi",SWE:"Graham Potter",
  BEL:"Rudi Garcia",IRN:"Amir Ghalenoei",EGY:"Hossam Hassan",NZL:"Darren Bazeley",
  ESP:"Luis de la Fuente",URU:"Marcelo Bielsa",KSA:"Georgios Donis",CPV:"Pedro Brito",
  FRA:"Didier Deschamps",SEN:"Pape Thiaw",NOR:"Ståle Solbakken",IRQ:"Graham Arnold",
  ARG:"Lionel Scaloni",AUT:"Ralf Rangnick",ALG:"Vladimir Petković",JOR:"Jamal Sellami",
  POR:"Roberto Martínez",COL:"Néstor Lorenzo",UZB:"Fabio Cannavaro",COD:"Sébastien Desabre",
  ENG:"Thomas Tuchel",CRO:"Zlatko Dalić",PAN:"Thomas Christiansen",GHA:"Carlos Queiroz",
};

function captainOf(code:string):string|null {
  const c=TEAM_PROFILES[code]?.xi.find(p=>p.name?.includes("(C)"));
  return c?.name?.replace(" (C)","")??null;
}

function tierForRank(r: number) {
  if (r<=6) return {label:"World Class",stars:5};
  if (r<=15) return {label:"Elite Contender",stars:4};
  if (r<=25) return {label:"Dark Horse",stars:4};
  if (r<=40) return {label:"Group Stage Battler",stars:3};
  if (r<=60) return {label:"Underdog",stars:2};
  return {label:"Long Shot",stars:1};
}

interface Fixture { id:string; group:string; matchday:number; homeCode:string; awayCode:string; kickoff:string; venue:string; city:string; country:string; }
interface ScoreResult { homeGoals:number; awayGoals:number; pkHome?:number; pkAway?:number; }
interface KoResult extends ScoreResult { homeCode:string; awayCode:string; }
interface MatchInfo { id:string; kickoff:string; venue:string; city:string; homeCode:string; awayCode:string; group?:string; matchday?:number; round?:string; }
interface StandingRow extends Team { played:number;win:number;draw:number;loss:number;gf:number;ga:number;gd:number;pts:number;role?:string;origin?:string; }

// The real 2026 group-stage schedule (matchups, matchday, and home/away) as drawn
// by FIFA. Matchday is the actual calendar round, not a synthetic round-robin order.
// Source: official fixture list; ordered MD1 → MD3 within each group.
const REAL_GROUP_FIXTURES: Fixture[] = [
  { id:"grp-A-1-0", group:"A", matchday:1, homeCode:"MEX", awayCode:"RSA", kickoff:"2026-06-11T19:00Z", venue:"Estadio Banorte", city:"Mexico City", country:"Mexico" },
  { id:"grp-A-1-1", group:"A", matchday:1, homeCode:"KOR", awayCode:"CZE", kickoff:"2026-06-12T02:00Z", venue:"Estadio Akron", city:"Guadalajara", country:"Mexico" },
  { id:"grp-A-2-0", group:"A", matchday:2, homeCode:"CZE", awayCode:"RSA", kickoff:"2026-06-18T16:00Z", venue:"Mercedes-Benz Stadium", city:"Atlanta, Georgia", country:"USA" },
  { id:"grp-A-2-1", group:"A", matchday:2, homeCode:"MEX", awayCode:"KOR", kickoff:"2026-06-19T01:00Z", venue:"Estadio Akron", city:"Guadalajara", country:"Mexico" },
  { id:"grp-A-3-0", group:"A", matchday:3, homeCode:"CZE", awayCode:"MEX", kickoff:"2026-06-25T01:00Z", venue:"Estadio Banorte", city:"Mexico City", country:"Mexico" },
  { id:"grp-A-3-1", group:"A", matchday:3, homeCode:"RSA", awayCode:"KOR", kickoff:"2026-06-25T01:00Z", venue:"Estadio BBVA", city:"Guadalupe", country:"Mexico" },
  { id:"grp-B-1-0", group:"B", matchday:1, homeCode:"CAN", awayCode:"BIH", kickoff:"2026-06-12T19:00Z", venue:"BMO Field", city:"Toronto", country:"Canada" },
  { id:"grp-B-1-1", group:"B", matchday:1, homeCode:"QAT", awayCode:"SUI", kickoff:"2026-06-13T19:00Z", venue:"Levi's Stadium", city:"Santa Clara, California", country:"USA" },
  { id:"grp-B-2-0", group:"B", matchday:2, homeCode:"SUI", awayCode:"BIH", kickoff:"2026-06-18T19:00Z", venue:"SoFi Stadium", city:"Inglewood, California", country:"USA" },
  { id:"grp-B-2-1", group:"B", matchday:2, homeCode:"CAN", awayCode:"QAT", kickoff:"2026-06-18T22:00Z", venue:"BC Place", city:"Vancouver", country:"Canada" },
  { id:"grp-B-3-0", group:"B", matchday:3, homeCode:"BIH", awayCode:"QAT", kickoff:"2026-06-24T19:00Z", venue:"Lumen Field", city:"Seattle, Washington", country:"USA" },
  { id:"grp-B-3-1", group:"B", matchday:3, homeCode:"SUI", awayCode:"CAN", kickoff:"2026-06-24T19:00Z", venue:"BC Place", city:"Vancouver", country:"Canada" },
  { id:"grp-C-1-0", group:"C", matchday:1, homeCode:"BRA", awayCode:"MAR", kickoff:"2026-06-13T22:00Z", venue:"MetLife Stadium", city:"East Rutherford, New Jersey", country:"USA" },
  { id:"grp-C-1-1", group:"C", matchday:1, homeCode:"HAI", awayCode:"SCO", kickoff:"2026-06-14T01:00Z", venue:"Gillette Stadium", city:"Foxborough, Massachusetts", country:"USA" },
  { id:"grp-C-2-0", group:"C", matchday:2, homeCode:"SCO", awayCode:"MAR", kickoff:"2026-06-19T22:00Z", venue:"Gillette Stadium", city:"Foxborough, Massachusetts", country:"USA" },
  { id:"grp-C-2-1", group:"C", matchday:2, homeCode:"BRA", awayCode:"HAI", kickoff:"2026-06-20T00:30Z", venue:"Lincoln Financial Field", city:"Philadelphia, Pennsylvania", country:"USA" },
  { id:"grp-C-3-0", group:"C", matchday:3, homeCode:"MAR", awayCode:"HAI", kickoff:"2026-06-24T22:00Z", venue:"Mercedes-Benz Stadium", city:"Atlanta, Georgia", country:"USA" },
  { id:"grp-C-3-1", group:"C", matchday:3, homeCode:"SCO", awayCode:"BRA", kickoff:"2026-06-24T22:00Z", venue:"Hard Rock Stadium", city:"Miami Gardens, Florida", country:"USA" },
  { id:"grp-D-1-0", group:"D", matchday:1, homeCode:"USA", awayCode:"PAR", kickoff:"2026-06-13T01:00Z", venue:"SoFi Stadium", city:"Inglewood, California", country:"USA" },
  { id:"grp-D-1-1", group:"D", matchday:1, homeCode:"AUS", awayCode:"TUR", kickoff:"2026-06-14T04:00Z", venue:"BC Place", city:"Vancouver", country:"Canada" },
  { id:"grp-D-2-0", group:"D", matchday:2, homeCode:"USA", awayCode:"AUS", kickoff:"2026-06-19T19:00Z", venue:"Lumen Field", city:"Seattle, Washington", country:"USA" },
  { id:"grp-D-2-1", group:"D", matchday:2, homeCode:"TUR", awayCode:"PAR", kickoff:"2026-06-20T03:00Z", venue:"Levi's Stadium", city:"Santa Clara, California", country:"USA" },
  { id:"grp-D-3-0", group:"D", matchday:3, homeCode:"PAR", awayCode:"AUS", kickoff:"2026-06-26T02:00Z", venue:"Levi's Stadium", city:"Santa Clara, California", country:"USA" },
  { id:"grp-D-3-1", group:"D", matchday:3, homeCode:"TUR", awayCode:"USA", kickoff:"2026-06-26T02:00Z", venue:"SoFi Stadium", city:"Inglewood, California", country:"USA" },
  { id:"grp-E-1-0", group:"E", matchday:1, homeCode:"GER", awayCode:"CUW", kickoff:"2026-06-14T17:00Z", venue:"NRG Stadium", city:"Houston, Texas", country:"USA" },
  { id:"grp-E-1-1", group:"E", matchday:1, homeCode:"CIV", awayCode:"ECU", kickoff:"2026-06-14T23:00Z", venue:"Lincoln Financial Field", city:"Philadelphia, Pennsylvania", country:"USA" },
  { id:"grp-E-2-0", group:"E", matchday:2, homeCode:"GER", awayCode:"CIV", kickoff:"2026-06-20T20:00Z", venue:"BMO Field", city:"Toronto", country:"Canada" },
  { id:"grp-E-2-1", group:"E", matchday:2, homeCode:"ECU", awayCode:"CUW", kickoff:"2026-06-21T00:00Z", venue:"GEHA Field at Arrowhead Stadium", city:"Kansas City, Missouri", country:"USA" },
  { id:"grp-E-3-0", group:"E", matchday:3, homeCode:"CUW", awayCode:"CIV", kickoff:"2026-06-25T20:00Z", venue:"Lincoln Financial Field", city:"Philadelphia, Pennsylvania", country:"USA" },
  { id:"grp-E-3-1", group:"E", matchday:3, homeCode:"ECU", awayCode:"GER", kickoff:"2026-06-25T20:00Z", venue:"MetLife Stadium", city:"East Rutherford, New Jersey", country:"USA" },
  { id:"grp-F-1-0", group:"F", matchday:1, homeCode:"NED", awayCode:"JPN", kickoff:"2026-06-14T20:00Z", venue:"AT&T Stadium", city:"Arlington, Texas", country:"USA" },
  { id:"grp-F-1-1", group:"F", matchday:1, homeCode:"SWE", awayCode:"TUN", kickoff:"2026-06-15T02:00Z", venue:"Estadio BBVA", city:"Guadalupe", country:"Mexico" },
  { id:"grp-F-2-0", group:"F", matchday:2, homeCode:"NED", awayCode:"SWE", kickoff:"2026-06-20T17:00Z", venue:"NRG Stadium", city:"Houston, Texas", country:"USA" },
  { id:"grp-F-2-1", group:"F", matchday:2, homeCode:"TUN", awayCode:"JPN", kickoff:"2026-06-21T04:00Z", venue:"Estadio BBVA", city:"Guadalupe", country:"Mexico" },
  { id:"grp-F-3-0", group:"F", matchday:3, homeCode:"JPN", awayCode:"SWE", kickoff:"2026-06-25T23:00Z", venue:"AT&T Stadium", city:"Arlington, Texas", country:"USA" },
  { id:"grp-F-3-1", group:"F", matchday:3, homeCode:"TUN", awayCode:"NED", kickoff:"2026-06-25T23:00Z", venue:"GEHA Field at Arrowhead Stadium", city:"Kansas City, Missouri", country:"USA" },
  { id:"grp-G-1-0", group:"G", matchday:1, homeCode:"BEL", awayCode:"EGY", kickoff:"2026-06-15T19:00Z", venue:"Lumen Field", city:"Seattle, Washington", country:"USA" },
  { id:"grp-G-1-1", group:"G", matchday:1, homeCode:"IRN", awayCode:"NZL", kickoff:"2026-06-16T01:00Z", venue:"SoFi Stadium", city:"Inglewood, California", country:"USA" },
  { id:"grp-G-2-0", group:"G", matchday:2, homeCode:"BEL", awayCode:"IRN", kickoff:"2026-06-21T19:00Z", venue:"SoFi Stadium", city:"Inglewood, California", country:"USA" },
  { id:"grp-G-2-1", group:"G", matchday:2, homeCode:"NZL", awayCode:"EGY", kickoff:"2026-06-22T01:00Z", venue:"BC Place", city:"Vancouver", country:"Canada" },
  { id:"grp-G-3-0", group:"G", matchday:3, homeCode:"EGY", awayCode:"IRN", kickoff:"2026-06-27T03:00Z", venue:"Lumen Field", city:"Seattle, Washington", country:"USA" },
  { id:"grp-G-3-1", group:"G", matchday:3, homeCode:"NZL", awayCode:"BEL", kickoff:"2026-06-27T03:00Z", venue:"BC Place", city:"Vancouver", country:"Canada" },
  { id:"grp-H-1-0", group:"H", matchday:1, homeCode:"ESP", awayCode:"CPV", kickoff:"2026-06-15T16:00Z", venue:"Mercedes-Benz Stadium", city:"Atlanta, Georgia", country:"USA" },
  { id:"grp-H-1-1", group:"H", matchday:1, homeCode:"KSA", awayCode:"URU", kickoff:"2026-06-15T22:00Z", venue:"Hard Rock Stadium", city:"Miami Gardens, Florida", country:"USA" },
  { id:"grp-H-2-0", group:"H", matchday:2, homeCode:"ESP", awayCode:"KSA", kickoff:"2026-06-21T16:00Z", venue:"Mercedes-Benz Stadium", city:"Atlanta, Georgia", country:"USA" },
  { id:"grp-H-2-1", group:"H", matchday:2, homeCode:"URU", awayCode:"CPV", kickoff:"2026-06-21T22:00Z", venue:"Hard Rock Stadium", city:"Miami Gardens, Florida", country:"USA" },
  { id:"grp-H-3-0", group:"H", matchday:3, homeCode:"CPV", awayCode:"KSA", kickoff:"2026-06-27T00:00Z", venue:"NRG Stadium", city:"Houston, Texas", country:"USA" },
  { id:"grp-H-3-1", group:"H", matchday:3, homeCode:"URU", awayCode:"ESP", kickoff:"2026-06-27T00:00Z", venue:"Estadio Akron", city:"Guadalajara", country:"Mexico" },
  { id:"grp-I-1-0", group:"I", matchday:1, homeCode:"FRA", awayCode:"SEN", kickoff:"2026-06-16T19:00Z", venue:"MetLife Stadium", city:"East Rutherford, New Jersey", country:"USA" },
  { id:"grp-I-1-1", group:"I", matchday:1, homeCode:"IRQ", awayCode:"NOR", kickoff:"2026-06-16T22:00Z", venue:"Gillette Stadium", city:"Foxborough, Massachusetts", country:"USA" },
  { id:"grp-I-2-0", group:"I", matchday:2, homeCode:"FRA", awayCode:"IRQ", kickoff:"2026-06-22T21:00Z", venue:"Lincoln Financial Field", city:"Philadelphia, Pennsylvania", country:"USA" },
  { id:"grp-I-2-1", group:"I", matchday:2, homeCode:"NOR", awayCode:"SEN", kickoff:"2026-06-23T00:00Z", venue:"MetLife Stadium", city:"East Rutherford, New Jersey", country:"USA" },
  { id:"grp-I-3-0", group:"I", matchday:3, homeCode:"NOR", awayCode:"FRA", kickoff:"2026-06-26T19:00Z", venue:"Gillette Stadium", city:"Foxborough, Massachusetts", country:"USA" },
  { id:"grp-I-3-1", group:"I", matchday:3, homeCode:"SEN", awayCode:"IRQ", kickoff:"2026-06-26T19:00Z", venue:"BMO Field", city:"Toronto", country:"Canada" },
  { id:"grp-J-1-0", group:"J", matchday:1, homeCode:"ARG", awayCode:"ALG", kickoff:"2026-06-17T01:00Z", venue:"GEHA Field at Arrowhead Stadium", city:"Kansas City, Missouri", country:"USA" },
  { id:"grp-J-1-1", group:"J", matchday:1, homeCode:"AUT", awayCode:"JOR", kickoff:"2026-06-17T04:00Z", venue:"Levi's Stadium", city:"Santa Clara, California", country:"USA" },
  { id:"grp-J-2-0", group:"J", matchday:2, homeCode:"ARG", awayCode:"AUT", kickoff:"2026-06-22T17:00Z", venue:"AT&T Stadium", city:"Arlington, Texas", country:"USA" },
  { id:"grp-J-2-1", group:"J", matchday:2, homeCode:"JOR", awayCode:"ALG", kickoff:"2026-06-23T03:00Z", venue:"Levi's Stadium", city:"Santa Clara, California", country:"USA" },
  { id:"grp-J-3-0", group:"J", matchday:3, homeCode:"ALG", awayCode:"AUT", kickoff:"2026-06-28T02:00Z", venue:"GEHA Field at Arrowhead Stadium", city:"Kansas City, Missouri", country:"USA" },
  { id:"grp-J-3-1", group:"J", matchday:3, homeCode:"JOR", awayCode:"ARG", kickoff:"2026-06-28T02:00Z", venue:"AT&T Stadium", city:"Arlington, Texas", country:"USA" },
  { id:"grp-K-1-0", group:"K", matchday:1, homeCode:"POR", awayCode:"COD", kickoff:"2026-06-17T17:00Z", venue:"NRG Stadium", city:"Houston, Texas", country:"USA" },
  { id:"grp-K-1-1", group:"K", matchday:1, homeCode:"UZB", awayCode:"COL", kickoff:"2026-06-18T02:00Z", venue:"Estadio Banorte", city:"Mexico City", country:"Mexico" },
  { id:"grp-K-2-0", group:"K", matchday:2, homeCode:"POR", awayCode:"UZB", kickoff:"2026-06-23T17:00Z", venue:"NRG Stadium", city:"Houston, Texas", country:"USA" },
  { id:"grp-K-2-1", group:"K", matchday:2, homeCode:"COL", awayCode:"COD", kickoff:"2026-06-24T02:00Z", venue:"Estadio Akron", city:"Guadalajara", country:"Mexico" },
  { id:"grp-K-3-0", group:"K", matchday:3, homeCode:"COD", awayCode:"UZB", kickoff:"2026-06-27T23:30Z", venue:"Mercedes-Benz Stadium", city:"Atlanta, Georgia", country:"USA" },
  { id:"grp-K-3-1", group:"K", matchday:3, homeCode:"COL", awayCode:"POR", kickoff:"2026-06-27T23:30Z", venue:"Hard Rock Stadium", city:"Miami Gardens, Florida", country:"USA" },
  { id:"grp-L-1-0", group:"L", matchday:1, homeCode:"ENG", awayCode:"CRO", kickoff:"2026-06-17T20:00Z", venue:"AT&T Stadium", city:"Arlington, Texas", country:"USA" },
  { id:"grp-L-1-1", group:"L", matchday:1, homeCode:"GHA", awayCode:"PAN", kickoff:"2026-06-17T23:00Z", venue:"BMO Field", city:"Toronto", country:"Canada" },
  { id:"grp-L-2-0", group:"L", matchday:2, homeCode:"ENG", awayCode:"GHA", kickoff:"2026-06-23T20:00Z", venue:"Gillette Stadium", city:"Foxborough, Massachusetts", country:"USA" },
  { id:"grp-L-2-1", group:"L", matchday:2, homeCode:"PAN", awayCode:"CRO", kickoff:"2026-06-23T23:00Z", venue:"BMO Field", city:"Toronto", country:"Canada" },
  { id:"grp-L-3-0", group:"L", matchday:3, homeCode:"CRO", awayCode:"GHA", kickoff:"2026-06-27T21:00Z", venue:"Lincoln Financial Field", city:"Philadelphia, Pennsylvania", country:"USA" },
  { id:"grp-L-3-1", group:"L", matchday:3, homeCode:"PAN", awayCode:"ENG", kickoff:"2026-06-27T21:00Z", venue:"MetLife Stadium", city:"East Rutherford, New Jersey", country:"USA" },
];
const FIXTURES_BY_GROUP: Record<string, Fixture[]> = REAL_GROUP_FIXTURES.reduce((acc, f) => {
  (acc[f.group] ||= []).push(f);
  return acc;
}, {} as Record<string, Fixture[]>);
function fixturesForGroup(letter: string): Fixture[] {
  return FIXTURES_BY_GROUP[letter] ?? [];
}
const ALL_GROUP_MATCHES = REAL_GROUP_FIXTURES;

// ── Live scores (real results from ESPN's public, keyless scoreboard API) ──────
// The tournament runs 2026-06-11 → 2026-07-19. Group events map by team pair;
// knockout events map by scheduled kickoff because their teams are not known up front.
const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=200";

// Our synthetic fixtures fix an arbitrary home/away orientation that won't match
// reality, so we look fixtures up by the unordered pair of team codes and flip the
// goals to match each fixture's orientation. ESPN's `abbreviation` values are a 1:1
// match for our 3-letter codes, so no name-mapping table is needed.
const pairKey = (a: string, b: string) => [a, b].sort().join("-");
const FIXTURE_BY_PAIR: Record<string, Fixture> = Object.fromEntries(
  ALL_GROUP_MATCHES.map(m => [pairKey(m.homeCode, m.awayCode), m])
);
const FIXTURE_BY_ID: Record<string, Fixture> = Object.fromEntries(
  ALL_GROUP_MATCHES.map(m => [m.id, m])
);

type GoalKind = "goal"|"header"|"penalty"|"freekick"|"volley"|"owngoal";
// A scored goal. `teamCode` is the team *credited* on the scoreline (so own goals
// are attributed to the beneficiary, which is how the match score reads).
interface GoalEvent { fixtureId:string; teamCode:string; player:string; minute:string; kind:GoalKind; }
interface CardEvent { teamCode:string; player:string; red:boolean; }
// A match currently in progress (oriented to the fixture's home/away).
interface LiveGame { fixtureId:string; eventId:string; homeCode:string; awayCode:string; homeGoals:number; awayGoals:number; clock:string; status:string; }
interface LiveData {
  results: Record<string, ScoreResult>;
  koResults: Record<string, KoResult>;
  goals: GoalEvent[];
  cards: CardEvent[];
  matchesPlayed: number;
  eventIds: Record<string, string>; // fixtureId → ESPN event id (for the detail view)
  liveGames: LiveGame[];
}

function goalKind(typeText:string, ownGoal:boolean, penalty:boolean):GoalKind {
  if (ownGoal) return "owngoal";
  if (penalty || /Penalty/i.test(typeText)) return "penalty";
  if (/Header/i.test(typeText)) return "header";
  if (/Volley/i.test(typeText)) return "volley";
  if (/Free.?kick/i.test(typeText)) return "freekick";
  return "goal";
}

function parsePenaltyScore(c:any):number|undefined {
  const raw = c?.shootoutScore ?? c?.penaltyScore ?? c?.penalties;
  const n = raw == null ? NaN : Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function eventTime(ev:any):number|null {
  const raw = ev?.date ?? ev?.competitions?.[0]?.date;
  const t = raw ? new Date(raw).getTime() : NaN;
  return Number.isFinite(t) ? t : null;
}

function findGroupFixtureForEvent(homeCode:string, awayCode:string, ev:any):Fixture|null {
  const fixture = FIXTURE_BY_PAIR[pairKey(homeCode, awayCode)];
  if(!fixture) return null;
  const t = eventTime(ev);
  if(t==null) return fixture;
  const delta = Math.abs(new Date(fixture.kickoff).getTime() - t);
  return delta <= 24 * 60 * 60 * 1000 ? fixture : null;
}

function findKoFixtureForEvent(ev:any, used:Set<string>):KoFixture|null {
  const t = eventTime(ev);
  if(t==null) return null;
  let best:KoFixture|null=null;
  let bestDelta=Infinity;
  for(const f of KO_FIXTURES){
    if(used.has(f.id)) continue;
    const d=Math.abs(new Date(f.kickoff).getTime()-t);
    if(d<bestDelta){ best=f; bestDelta=d; }
  }
  // ESPN kickoff times can drift; this still prevents random future fixtures matching.
  return best&&bestDelta<=8*60*60*1000 ? best : null;
}

async function fetchLiveData(): Promise<LiveData> {
  const resp = await fetch(ESPN_SCOREBOARD_URL);
  if (!resp.ok) throw new Error(`ESPN responded ${resp.status}`);
  const data = await resp.json();
  const results: Record<string, ScoreResult> = {};
  const koResults: Record<string, KoResult> = {};
  const goals: GoalEvent[] = [];
  const cards: CardEvent[] = [];
  const eventIds: Record<string, string> = {};
  const liveGames: LiveGame[] = [];
  const usedKoFixtures = new Set<string>();
  let matchesPlayed = 0;
  for (const ev of (data.events ?? []) as any[]) {
    const comp = ev.competitions?.[0];
    if (!comp) continue;
    const competitors = comp.competitors ?? [];
    const home = competitors.find((c: any) => c.homeAway === "home");
    const away = competitors.find((c: any) => c.homeAway === "away");
    const hc = home?.team?.abbreviation, ac = away?.team?.abbreviation;
    if (!hc || !ac) continue;
    const groupFixture = findGroupFixtureForEvent(hc, ac, ev);
    const koFixture = groupFixture ? null : findKoFixtureForEvent(ev, usedKoFixtures);
    const fixture = groupFixture ?? koFixture;
    if (!fixture) continue;
    if (koFixture) usedKoFixtures.add(koFixture.id);
    const hg = parseInt(home.score, 10), ag = parseInt(away.score, 10);
    // orient ESPN's home/away to the fixture's home/away
    const orient = (h: number, a: number) =>
      groupFixture && groupFixture.homeCode === hc ? { homeGoals: h, awayGoals: a } : { homeGoals: a, awayGoals: h };

    const state = comp.status?.type?.state;
    if (state === "in") {
      const o = groupFixture ? orient(Number.isNaN(hg) ? 0 : hg, Number.isNaN(ag) ? 0 : ag)
        : { homeGoals:Number.isNaN(hg) ? 0 : hg, awayGoals:Number.isNaN(ag) ? 0 : ag };
      liveGames.push({
        fixtureId: fixture.id, eventId: String(ev.id ?? ""),
        homeCode: groupFixture ? groupFixture.homeCode : hc, awayCode: groupFixture ? groupFixture.awayCode : ac,
        homeGoals: o.homeGoals, awayGoals: o.awayGoals,
        clock: comp.status?.displayClock ?? "", status: comp.status?.type?.description ?? "Live",
      });
      continue;
    }
    if (!comp.status?.type?.completed) continue;
    if (Number.isNaN(hg) || Number.isNaN(ag)) continue;
    if(groupFixture) {
      results[fixture.id] = orient(hg, ag);
    } else {
      koResults[fixture.id] = { homeCode:hc, awayCode:ac, homeGoals:hg, awayGoals:ag, pkHome:parsePenaltyScore(home), pkAway:parsePenaltyScore(away) };
    }
    if (ev.id) eventIds[fixture.id] = String(ev.id);
    matchesPlayed++;

    // team id → abbreviation, for attributing goals/cards
    const idToAbbr: Record<string,string> = {};
    for (const c of competitors) idToAbbr[c.team?.id] = c.team?.abbreviation;
    for (const x of (comp.details ?? []) as any[]) {
      const ath = (x.athletesInvolved ?? [])[0];
      const player = ath?.displayName ?? "Unknown";
      const scorerTeamId = ath?.team?.id ?? x.team?.id;
      const scorerCode = idToAbbr[scorerTeamId];
      if (x.scoringPlay) {
        const kind = goalKind(x.type?.text ?? "", !!x.ownGoal, !!x.penaltyKick);
        // own goals count for the opponent
        const teamCode = kind === "owngoal"
          ? (scorerCode === hc ? ac : hc)
          : scorerCode;
        goals.push({ fixtureId: fixture.id, teamCode, player, minute: x.clock?.displayValue ?? "", kind });
      } else if (x.yellowCard || x.redCard) {
        cards.push({ teamCode: scorerCode, player, red: !!x.redCard });
      }
    }
  }
  return { results, koResults, goals, cards, matchesPlayed, eventIds, liveGames };
}

// Fixtures whose real kickoff window overlaps `now` — used to decide when to poll
// for live games (so we only hit the network during plausible match windows).
const LIVE_WINDOW_MS = 150 * 60 * 1000; // ~2.5h covers 90' + stoppage + half-time
function anyMatchWindowActive(now: number): boolean {
  return [...ALL_GROUP_MATCHES, ...KO_FIXTURES].some(f => {
    const k = new Date(f.kickoff).getTime();
    return now >= k - 5 * 60000 && now <= k + LIVE_WINDOW_MS;
  });
}

// ── Detailed match view (per-match ESPN summary: lineups, formations, timeline) ──
const SUMMARY_URL = (eventId: string) =>
  `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${eventId}`;

interface DetailPlayer { name:string; jersey:string; pos:string; place:number; starter:boolean; on:boolean; off:boolean; captain:boolean; }
interface DetailTeam { side:"home"|"away"; code:string; name:string; formation:string; starters:DetailPlayer[]; bench:DetailPlayer[]; }
type TLType = "goal"|"yellow"|"red"|"sub";
interface TimelineEvent { order:number; minute:string; side:"home"|"away"; type:TLType; main:string; detail?:string; }
interface MatchDetail { home:DetailTeam|null; away:DetailTeam|null; events:TimelineEvent[]; }

function parseRoster(r:any):DetailTeam {
  const players:DetailPlayer[] = (r.roster ?? []).map((p:any)=>({
    name: p.athlete?.displayName ?? "?",
    jersey: String(p.jersey ?? ""),
    pos: p.position?.abbreviation ?? "",
    place: Number(p.formationPlace ?? 0),
    starter: !!p.starter,
    on: !!p.subbedIn,
    off: !!p.subbedOut,
    captain: !!p.captain,
  }));
  return {
    side: r.homeAway,
    code: r.team?.abbreviation ?? "",
    name: r.team?.displayName ?? "",
    formation: r.formation ?? "",
    starters: players.filter(p=>p.starter).sort((a,b)=>a.place-b.place),
    bench: players.filter(p=>!p.starter),
  };
}

async function fetchMatchDetail(eventId:string):Promise<MatchDetail> {
  const resp = await fetch(SUMMARY_URL(eventId));
  if (!resp.ok) throw new Error(`ESPN responded ${resp.status}`);
  const s = await resp.json();
  const rosters = s.rosters ?? [];
  const home = rosters.find((r:any)=>r.homeAway==="home");
  const away = rosters.find((r:any)=>r.homeAway==="away");
  const homeTeam = home ? parseRoster(home) : null;
  const awayTeam = away ? parseRoster(away) : null;

  // Map EVERY name variant a team might appear as in commentary (United States / USA /
  // USMNT / etc.) to its side — matching only the roster's displayName silently drops goals.
  const nameToSide:Record<string,"home"|"away"> = {};
  const addNames = (team:any, side:"home"|"away") => {
    for (const key of ["displayName","shortDisplayName","name","abbreviation","location","nickname"]) {
      const v = team?.[key]; if (v) nameToSide[String(v).trim()] = side;
    }
  };
  addNames(home?.team, "home");
  addNames(away?.team, "away");
  const flip = (s:"home"|"away") => s==="home"?"away":"home";

  const events:TimelineEvent[] = [];
  let order = 0;
  for (const c of (s.commentary ?? []) as any[]) {
    const text:string = c.text ?? "";
    const minute:string = c.time?.displayValue ?? "";
    let m:RegExpMatchArray|null;
    if (/^Goal!/.test(text)) {
      m = text.match(/\.\s*([^().]+?)\s*\(([^)]+)\)/);
      const side = m ? nameToSide[m[2].trim()] : undefined;
      const a = text.match(/Assisted by ([^.]+?)(?:\s+(?:with|following)|\.)/);
      if (side && m) events.push({ order:order++, minute, side, type:"goal", main:m[1].trim(), detail: a?`assist: ${a[1].trim()}`:undefined });
    } else if (/^Own Goal by/.test(text)) {
      // ESPN format: "Own Goal by <Player>, <Team>. <score>." — the goal counts
      // for the *opponent* of the player's team, so attribute it to the flip side.
      m = text.match(/^Own Goal by (.+?),\s*([^.]+?)\./);
      const scorerSide = m ? nameToSide[m[2].trim()] : undefined;
      if (scorerSide && m) events.push({ order:order++, minute, side:flip(scorerSide), type:"goal", main:`${m[1].trim()} (OG)` });
    } else if (/^Substitution,/.test(text)) {
      m = text.match(/^Substitution,\s*([^.]+?)\.\s*(.+?)\s+replaces\s+(.+?)\.?$/);
      const side = m ? nameToSide[m[1].trim()] : undefined;
      if (side && m) events.push({ order:order++, minute, side, type:"sub", main:m[2].trim(), detail:`off: ${m[3].trim()}` });
    } else if (/is shown the .*red card/i.test(text)) {
      m = text.match(/([^.]+?)\s*\(([^)]+)\)\s*is shown/);
      const side = m ? nameToSide[m[2].trim()] : undefined;
      if (side && m) events.push({ order:order++, minute, side, type:"red", main:m[1].trim() });
    } else if (/is shown the .*yellow card/i.test(text)) {
      m = text.match(/([^.]+?)\s*\(([^)]+)\)\s*is shown/);
      const side = m ? nameToSide[m[2].trim()] : undefined;
      if (side && m) events.push({ order:order++, minute, side, type:"yellow", main:m[1].trim() });
    }
  }
  return { home:homeTeam, away:awayTeam, events };
}

// ── Confirmed lineups (ESPN-sourced) ──────────────────────────────────────────
// A team's most recent ESPN-published starting XI. We only ever claim a lineup is
// "confirmed" when it comes from here — the static TEAM_PROFILES XIs are predictions.
interface ConfirmedXI { code:string; formation:string; xi:Player[]; fixtureId:string; kickoffMs:number; }

const PLAYER_CLUB_OVERRIDES: Record<string,string> = {
  // "TEAM|normalized player name": "Club"
};

const cleanPlayerName=(n:string)=>n
  .replace(/\s*\(C\)\s*/gi," ")
  .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .replace(/[.'’]/g,"")
  .replace(/-/g," ")
  .replace(/\b(jr|sr|ii|iii|iv)\b/gi,"")
  .replace(/\s+/g," ")
  .trim()
  .toLowerCase();
const lastName=(n:string)=>{
  const p=cleanPlayerName(n).split(" ").filter(Boolean);
  return p.length>1?p[p.length-1]:p[0]??"";
};
const clubOverrideKey=(code:string,name:string)=>`${code}|${cleanPlayerName(name)}`;

// Convert an ESPN roster into the Player[] shape the pitch diagram expects, sorted
// by formation place (GK → attack). Club is enriched from the static squad data.
function detailTeamToXI(r:DetailTeam):Player[]{
  const clubByFullName=new Map<string,string>();
  const clubByLastName=new Map<string,string>();
  const prof=TEAM_PROFILES[r.code];
  if(prof) for(const p of prof.xi){
    if(!p.name||!p.club) continue;
    const full=cleanPlayerName(p.name);
    const last=lastName(p.name);
    if(full) clubByFullName.set(full,p.club);
    if(last&&!clubByLastName.has(last)) clubByLastName.set(last,p.club);
  }
  return r.starters.map(p=>({
    name: p.captain?`${p.name} (C)`:p.name,
    club: PLAYER_CLUB_OVERRIDES[clubOverrideKey(r.code,p.name)]
      ?? clubByFullName.get(cleanPlayerName(p.name))
      ?? clubByLastName.get(lastName(p.name))
      ?? "",
    pos: p.pos || "",
  }));
}

// Fetch the published rosters for one event (only teams that already have a posted XI).
async function fetchEventLineups(eventId:string):Promise<DetailTeam[]>{
  const resp=await fetch(SUMMARY_URL(eventId));
  if(!resp.ok) throw new Error(`ESPN responded ${resp.status}`);
  const s=await resp.json();
  return ((s.rosters ?? []) as any[]).map(parseRoster).filter(r=>r.starters.length>=11);
}

function computeStandings(letter: string, groupResults: Record<string, ScoreResult>): StandingRow[] {
  const teams = groupTeams(letter);
  const table: Record<string, StandingRow> = {};
  teams.forEach(t=>{table[t.code]={...t,played:0,win:0,draw:0,loss:0,gf:0,ga:0,gd:0,pts:0};});
  fixturesForGroup(letter).forEach(m=>{
    const res=groupResults[m.id]; if(!res) return;
    const h=table[m.homeCode],a=table[m.awayCode];
    h.played++;a.played++;h.gf+=res.homeGoals;h.ga+=res.awayGoals;a.gf+=res.awayGoals;a.ga+=res.homeGoals;
    if(res.homeGoals>res.awayGoals){h.win++;h.pts+=3;a.loss++;}
    else if(res.homeGoals<res.awayGoals){a.win++;a.pts+=3;h.loss++;}
    else{h.draw++;a.draw++;h.pts+=1;a.pts+=1;}
  });
  const arr=Object.values(table);
  arr.forEach(t=>{t.gd=t.gf-t.ga;});
  arr.sort((x,y)=>(y.pts-x.pts)||(y.gd-x.gd)||(y.gf-x.gf)||(y.rating-x.rating));
  return arr;
}

const groupIsComplete=(letter:string,r:Record<string,ScoreResult>)=>fixturesForGroup(letter).every(m=>r[m.id]);

function computeQualifiers(groupResults: Record<string, ScoreResult>) {
  const winners:StandingRow[]=[],runnersUp:StandingRow[]=[],thirdsPool:StandingRow[]=[];
  GROUP_LETTERS.forEach(letter=>{
    const table=computeStandings(letter,groupResults);
    winners.push({...table[0],role:"W",origin:letter});
    runnersUp.push({...table[1],role:"R",origin:letter});
    thirdsPool.push({...table[2],role:"T",origin:letter});
  });
  const rankFn=(a:StandingRow,b:StandingRow)=>(b.pts-a.pts)||(b.gd-a.gd)||(b.gf-a.gf)||(b.rating-a.rating);
  winners.sort(rankFn);runnersUp.sort(rankFn);thirdsPool.sort(rankFn);
  return{winners,runnersUp,bestThirds:thirdsPool.slice(0,8),allThirds:thirdsPool};
}

// ── Real 2026 knockout schedule (slots, dates, venues from the official draw) ──
interface KoFixture { id:string; round:string; n:number; kickoff:string; venue:string; city:string; homeSlot:string; awaySlot:string; }
const KO_FIXTURES: KoFixture[] = [
  { id:"ko-R32-1", round:"R32", n:1, kickoff:"2026-06-28T19:00Z", venue:"SoFi Stadium", city:"Inglewood, California", homeSlot:"Group A 2nd Place", awaySlot:"Group B 2nd Place" },
  { id:"ko-R32-2", round:"R32", n:2, kickoff:"2026-06-29T17:00Z", venue:"NRG Stadium", city:"Houston, Texas", homeSlot:"Group C Winner", awaySlot:"Group F 2nd Place" },
  { id:"ko-R32-3", round:"R32", n:3, kickoff:"2026-06-29T20:30Z", venue:"Gillette Stadium", city:"Foxborough, Massachusetts", homeSlot:"Germany", awaySlot:"Third Place Group A/B/C/D/F" },
  { id:"ko-R32-4", round:"R32", n:4, kickoff:"2026-06-30T01:00Z", venue:"Estadio BBVA", city:"Guadalupe", homeSlot:"Group F Winner", awaySlot:"Group C 2nd Place" },
  { id:"ko-R32-5", round:"R32", n:5, kickoff:"2026-06-30T17:00Z", venue:"AT&T Stadium", city:"Arlington, Texas", homeSlot:"Group E 2nd Place", awaySlot:"Group I 2nd Place" },
  { id:"ko-R32-6", round:"R32", n:6, kickoff:"2026-06-30T21:00Z", venue:"MetLife Stadium", city:"East Rutherford, New Jersey", homeSlot:"Group I Winner", awaySlot:"Third Place Group C/D/F/G/H" },
  { id:"ko-R32-7", round:"R32", n:7, kickoff:"2026-07-01T01:00Z", venue:"Estadio Banorte", city:"Mexico City", homeSlot:"Mexico", awaySlot:"Third Place Group C/E/F/H/I" },
  { id:"ko-R32-8", round:"R32", n:8, kickoff:"2026-07-01T16:00Z", venue:"Mercedes-Benz Stadium", city:"Atlanta, Georgia", homeSlot:"Group L Winner", awaySlot:"Third Place Group E/H/I/J/K" },
  { id:"ko-R32-9", round:"R32", n:9, kickoff:"2026-07-01T20:00Z", venue:"Lumen Field", city:"Seattle, Washington", homeSlot:"Group G Winner", awaySlot:"Third Place Group A/E/H/I/J" },
  { id:"ko-R32-10", round:"R32", n:10, kickoff:"2026-07-02T00:00Z", venue:"Levi's Stadium", city:"Santa Clara, California", homeSlot:"United States", awaySlot:"Third Place Group B/E/F/I/J" },
  { id:"ko-R32-11", round:"R32", n:11, kickoff:"2026-07-02T19:00Z", venue:"SoFi Stadium", city:"Inglewood, California", homeSlot:"Group H Winner", awaySlot:"Group J 2nd Place" },
  { id:"ko-R32-12", round:"R32", n:12, kickoff:"2026-07-02T23:00Z", venue:"BMO Field", city:"Toronto", homeSlot:"Group K 2nd Place", awaySlot:"Group L 2nd Place" },
  { id:"ko-R32-13", round:"R32", n:13, kickoff:"2026-07-03T03:00Z", venue:"BC Place", city:"Vancouver", homeSlot:"Group B Winner", awaySlot:"Third Place Group E/F/G/I/J" },
  { id:"ko-R32-14", round:"R32", n:14, kickoff:"2026-07-03T18:00Z", venue:"AT&T Stadium", city:"Arlington, Texas", homeSlot:"Group D 2nd Place", awaySlot:"Group G 2nd Place" },
  { id:"ko-R32-15", round:"R32", n:15, kickoff:"2026-07-03T22:00Z", venue:"Hard Rock Stadium", city:"Miami Gardens, Florida", homeSlot:"Argentina", awaySlot:"Group H 2nd Place" },
  { id:"ko-R32-16", round:"R32", n:16, kickoff:"2026-07-04T01:30Z", venue:"GEHA Field at Arrowhead Stadium", city:"Kansas City, Missouri", homeSlot:"Group K Winner", awaySlot:"Third Place Group D/E/I/J/L" },
  { id:"ko-R16-1", round:"R16", n:1, kickoff:"2026-07-04T17:00Z", venue:"NRG Stadium", city:"Houston, Texas", homeSlot:"Round of 32 1 Winner", awaySlot:"Round of 32 3 Winner" },
  { id:"ko-R16-2", round:"R16", n:2, kickoff:"2026-07-04T21:00Z", venue:"Lincoln Financial Field", city:"Philadelphia, Pennsylvania", homeSlot:"Round of 32 2 Winner", awaySlot:"Round of 32 5 Winner" },
  { id:"ko-R16-3", round:"R16", n:3, kickoff:"2026-07-05T20:00Z", venue:"MetLife Stadium", city:"East Rutherford, New Jersey", homeSlot:"Round of 32 4 Winner", awaySlot:"Round of 32 6 Winner" },
  { id:"ko-R16-4", round:"R16", n:4, kickoff:"2026-07-06T00:00Z", venue:"Estadio Banorte", city:"Mexico City", homeSlot:"Round of 32 7 Winner", awaySlot:"Round of 32 8 Winner" },
  { id:"ko-R16-5", round:"R16", n:5, kickoff:"2026-07-06T19:00Z", venue:"AT&T Stadium", city:"Arlington, Texas", homeSlot:"Round of 32 11 Winner", awaySlot:"Round of 32 12 Winner" },
  { id:"ko-R16-6", round:"R16", n:6, kickoff:"2026-07-07T00:00Z", venue:"Lumen Field", city:"Seattle, Washington", homeSlot:"Round of 32 9 Winner", awaySlot:"Round of 32 10 Winner" },
  { id:"ko-R16-7", round:"R16", n:7, kickoff:"2026-07-07T16:00Z", venue:"Mercedes-Benz Stadium", city:"Atlanta, Georgia", homeSlot:"Round of 32 14 Winner", awaySlot:"Round of 32 16 Winner" },
  { id:"ko-R16-8", round:"R16", n:8, kickoff:"2026-07-07T20:00Z", venue:"BC Place", city:"Vancouver", homeSlot:"Round of 32 13 Winner", awaySlot:"Round of 32 15 Winner" },
  { id:"ko-QF-1", round:"QF", n:1, kickoff:"2026-07-09T20:00Z", venue:"Gillette Stadium", city:"Foxborough, Massachusetts", homeSlot:"Round of 16 1 Winner", awaySlot:"Round of 16 2 Winner" },
  { id:"ko-QF-2", round:"QF", n:2, kickoff:"2026-07-10T19:00Z", venue:"SoFi Stadium", city:"Inglewood, California", homeSlot:"Round of 16 5 Winner", awaySlot:"Round of 16 6 Winner" },
  { id:"ko-QF-3", round:"QF", n:3, kickoff:"2026-07-11T21:00Z", venue:"Hard Rock Stadium", city:"Miami Gardens, Florida", homeSlot:"Round of 16 3 Winner", awaySlot:"Round of 16 4 Winner" },
  { id:"ko-QF-4", round:"QF", n:4, kickoff:"2026-07-12T01:00Z", venue:"GEHA Field at Arrowhead Stadium", city:"Kansas City, Missouri", homeSlot:"Round of 16 7 Winner", awaySlot:"Round of 16 8 Winner" },
  { id:"ko-SF-1", round:"SF", n:1, kickoff:"2026-07-14T19:00Z", venue:"AT&T Stadium", city:"Arlington, Texas", homeSlot:"Quarterfinal 1 Winner", awaySlot:"Quarterfinal 2 Winner" },
  { id:"ko-SF-2", round:"SF", n:2, kickoff:"2026-07-15T19:00Z", venue:"Mercedes-Benz Stadium", city:"Atlanta, Georgia", homeSlot:"Quarterfinal 3 Winner", awaySlot:"Quarterfinal 4 Winner" },
  { id:"ko-3P-1", round:"3P", n:1, kickoff:"2026-07-18T21:00Z", venue:"Hard Rock Stadium", city:"Miami Gardens, Florida", homeSlot:"Semifinal 1 Loser", awaySlot:"Semifinal 2 Loser" },
  { id:"ko-F-1", round:"F", n:1, kickoff:"2026-07-19T19:00Z", venue:"MetLife Stadium", city:"East Rutherford, New Jersey", homeSlot:"Semifinal 1 Winner", awaySlot:"Semifinal 2 Winner" },
];
const KO_FIXTURE_BY_ID: Record<string, KoFixture> = Object.fromEntries(KO_FIXTURES.map(f=>[f.id,f]));
const KO_ROUND_LABEL:Record<string,string>={R32:"Round of 32",R16:"Round of 16",QF:"Quarterfinals",SF:"Semifinals","3P":"Third place",F:"Final"};

// ── Bracket layout order ──────────────────────────────────────────────────────
// The official draw doesn't pair feeders in fixture-number order (R16-1 ← R32-1 & R32-3),
// so we walk the feeder tree from the Final to order each round top→bottom such that a
// match's two feeders are vertically adjacent — required for the connector lines.
const KO_WINNER_PREFIX:Record<string,string>={R32:"Round of 32",R16:"Round of 16",QF:"Quarterfinal",SF:"Semifinal"};
const KO_BY_WINNER_SLOT:Record<string,KoFixture>=Object.fromEntries(
  KO_FIXTURES.filter(f=>KO_WINNER_PREFIX[f.round]).map(f=>[`${KO_WINNER_PREFIX[f.round]} ${f.n} Winner`,f])
);
const koFeeders=(f:KoFixture):(KoFixture|undefined)[]=>[KO_BY_WINNER_SLOT[f.homeSlot],KO_BY_WINNER_SLOT[f.awaySlot]];
// In-order DFS from a root fixture → each round's fixtures top→bottom (feeders adjacent).
function koOrderFrom(root:KoFixture|undefined):Record<string,string[]>{
  const order:Record<string,string[]>={R32:[],R16:[],QF:[],SF:[]};
  if(!root) return order;
  const seen=new Set<string>();
  const visit=(f:KoFixture)=>{ if(seen.has(f.id))return; seen.add(f.id); const [h,a]=koFeeders(f); if(h)visit(h); (order[f.round] ||= []).push(f.id); if(a)visit(a); };
  visit(root);
  return order;
}
// The two halves of the bracket = the two semifinal sub-trees (from the official draw).
const LEFT_ORDER=koOrderFrom(KO_FIXTURES.find(f=>f.round==="SF"&&f.n===1));
const RIGHT_ORDER=koOrderFrom(KO_FIXTURES.find(f=>f.round==="SF"&&f.n===2));
const TEAM_BY_NAME:Record<string,Team>=Object.fromEntries(TEAMS.map(t=>[t.name,t]));

function matchInfoFor(id:string, koResults:Record<string,KoResult>, liveByFixture:Record<string,LiveGame>):MatchInfo|null{
  const group=FIXTURE_BY_ID[id];
  if(group) return {...group};
  const ko=KO_FIXTURE_BY_ID[id];
  if(!ko) return null;
  const live=liveByFixture[id];
  const result=koResults[id];
  const homeCode=live?.homeCode ?? result?.homeCode;
  const awayCode=live?.awayCode ?? result?.awayCode;
  if(!homeCode||!awayCode) return null;
  return { id:ko.id, kickoff:ko.kickoff, venue:ko.venue, city:ko.city, round:ko.round, homeCode, awayCode };
}

function shortSlot(s:string):string {
  let m:RegExpMatchArray|null;
  if((m=s.match(/^Group (\w+) Winner$/))) return `Winner ${m[1]}`;
  if((m=s.match(/^Group (\w+) 2nd Place$/))) return `Runner-up ${m[1]}`;
  if((m=s.match(/^Third Place Group (.+)$/))) return `3rd ${m[1]}`;
  if((m=s.match(/^Round of 32 (\d+) Winner$/))) return `Winner R32·${m[1]}`;
  if((m=s.match(/^Round of 16 (\d+) Winner$/))) return `Winner R16·${m[1]}`;
  if((m=s.match(/^Quarterfinal (\d+) Winner$/))) return `Winner QF${m[1]}`;
  if((m=s.match(/^Semifinal (\d+) Winner$/))) return `Winner SF${m[1]}`;
  if((m=s.match(/^Semifinal (\d+) Loser$/))) return `Loser SF${m[1]}`;
  return s;
}

interface KoSide { team:Team|StandingRow|null; label:string; }
function koWinnerCode(r:KoResult|undefined):string|null{
  if(!r) return null;
  if(r.homeGoals>r.awayGoals) return r.homeCode;
  if(r.awayGoals>r.homeGoals) return r.awayCode;
  if((r.pkHome??0)>(r.pkAway??0)) return r.homeCode;
  if((r.pkAway??0)>(r.pkHome??0)) return r.awayCode;
  return null;
}
function koLoserCode(r:KoResult|undefined):string|null{
  const w=koWinnerCode(r);
  if(!w||!r) return null;
  return w===r.homeCode?r.awayCode:r.homeCode;
}
function koFixtureByRoundNumber(round:string,n:number):KoFixture|undefined{
  return KO_FIXTURES.find(f=>f.round===round&&f.n===n);
}
function teamSide(code:string|null,label:string):KoSide{
  const team=code?TEAM_BY_CODE[code]:null;
  return team?{team,label:team.name}:{team:null,label};
}
function resolveKoSlot(slot:string, standings:Record<string,StandingRow[]>, koResults:Record<string,KoResult>={}):KoSide {
  let m:RegExpMatchArray|null;
  if((m=slot.match(/^Group (\w+) Winner$/))) return { team:standings[m[1]]?.[0]??null, label:`Winner ${m[1]}` };
  if((m=slot.match(/^Group (\w+) 2nd Place$/))) return { team:standings[m[1]]?.[1]??null, label:`Runner-up ${m[1]}` };
  if((m=slot.match(/^Round of 32 (\d+) Winner$/))) return teamSide(koWinnerCode(koResults[koFixtureByRoundNumber("R32",Number(m[1]))?.id ?? ""]), shortSlot(slot));
  if((m=slot.match(/^Round of 16 (\d+) Winner$/))) return teamSide(koWinnerCode(koResults[koFixtureByRoundNumber("R16",Number(m[1]))?.id ?? ""]), shortSlot(slot));
  if((m=slot.match(/^Quarterfinal (\d+) Winner$/))) return teamSide(koWinnerCode(koResults[koFixtureByRoundNumber("QF",Number(m[1]))?.id ?? ""]), shortSlot(slot));
  if((m=slot.match(/^Semifinal (\d+) Winner$/))) return teamSide(koWinnerCode(koResults[koFixtureByRoundNumber("SF",Number(m[1]))?.id ?? ""]), shortSlot(slot));
  if((m=slot.match(/^Semifinal (\d+) Loser$/))) return teamSide(koLoserCode(koResults[koFixtureByRoundNumber("SF",Number(m[1]))?.id ?? ""]), shortSlot(slot));
  const byName=TEAM_BY_NAME[slot];
  if(byName) return { team:byName, label:byName.name };
  return { team:null, label:shortSlot(slot) };
}

interface ResolvedKo { fixture:KoFixture; home:KoSide; away:KoSide; }
function resolveKnockout(groupResults:Record<string,ScoreResult>, koResults:Record<string,KoResult>={}):ResolvedKo[] {
  const standings:Record<string,StandingRow[]>={};
  for(const L of GROUP_LETTERS) standings[L]=computeStandings(L,groupResults);
  return KO_FIXTURES.map(f=>{
    const result=koResults[f.id];
    return result
      ? { fixture:f, home:teamSide(result.homeCode,shortSlot(f.homeSlot)), away:teamSide(result.awayCode,shortSlot(f.awaySlot)) }
      : { fixture:f, home:resolveKoSlot(f.homeSlot,standings,koResults), away:resolveKoSlot(f.awaySlot,standings,koResults) };
  });
}


const fmtGD=(n:number)=>n>0?`+${n}`:`${n}`;

// Where a knockout team came from, e.g. "1st · Grp A" / "3rd · Grp E".
function seedLabel(t:Team|StandingRow|null):string|null{
  if(!t||!("role" in t)||!t.origin)return null;
  const r=(t as StandingRow).role;
  if(r==="W")return `1st · Grp ${t.origin}`;
  if(r==="R")return `2nd · Grp ${t.origin}`;
  if(r==="T")return `3rd · Grp ${t.origin}`;
  return null;
}

// Kickoff times are stored in UTC; show them in the viewer's local timezone.
function formatKickoff(iso:string){
  const d=new Date(iso);
  if(isNaN(d.getTime())) return {date:"",time:""};
  return {
    date:d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}),
    time:d.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"}),
  };
}

function TeamChip({team,dim,onSelect}:{team:Team|StandingRow|null;dim?:boolean;onSelect?:(code:string)=>void}) {
  if(!team) return <span className="wc-chip wc-chip-tbd"><span className="wc-chip-flag">—</span><span className="wc-chip-name">TBD</span></span>;
  const confed=CONFED[team.confed];
  return (
    <span className={`wc-chip${dim?" wc-chip-dim":""}`}>
      <Flag code={team.code} className="wc-chip-flag"/>
      <span className="wc-chip-code" style={{background:confed.color}}>{team.code}</span>
      {onSelect
        ? <button className="wc-chip-name wc-chip-name-link" onClick={()=>onSelect(team.code)}>{team.name}</button>
        : <span className="wc-chip-name">{team.name}</span>}
    </span>
  );
}

function StarRating({stars}:{stars:number}) {
  return (
    <span className="wc-stars">
      {[1,2,3,4,5].map(i=>(
        <Star key={i} size={11} className={i<=stars?"wc-star-on":"wc-star-off"} fill={i<=stars?"currentColor":"none"} />
      ))}
    </span>
  );
}

// Depth rank from a position label (GK at the back → forwards up front). Used to band
// players into formation rows regardless of the source array's order (ESPN lineups
// aren't reliably ordered, so slicing raw would drop a winger into the defensive line).
// Handles both standard abbreviations (CB, RW, CDM, GK, ST) and ESPN's (G, CD, AM-R, F).
function posRank(pos:string):number{
  // ESPN encodes side as a "-R"/"-L" suffix (AM-R, CD-L); strip it for classification.
  const p=(pos||"").toUpperCase().replace(/[-\s]?[LR]$/,"");
  if(p==="G"||p.includes("GK")) return 0;                                           // goalkeeper
  if(p.includes("WB")) return 15;                                                   // wing-backs
  if(p==="CD"||p==="D"||p.endsWith("B")||p==="SW") return 10;                       // CB/CD/RB/LB/sweeper
  if(p.includes("DM")) return 20;                                                   // defensive mid
  if(p.includes("AM")) return 40;                                                   // attacking mid
  if(p==="F"||p.includes("ST")||p.endsWith("F")||p.includes("FW")||p.includes("SS")||p.includes("W")) return 50; // wings & forwards
  if(p.includes("M")) return 30;                                                    // central/wide mid
  return 35;
}
// Horizontal placement within a row. Side is a "-R"/"-L" suffix (ESPN) or an L/R prefix
// (standard): left-sided to the left, right-sided to the right, centrals in the middle.
function posSide(pos:string):number{
  const p=(pos||"").toUpperCase();
  if(/[-\s]?R$/.test(p)) return 1;
  if(/[-\s]?L$/.test(p)) return -1;
  if(p[0]==="L") return -1;
  if(p[0]==="R") return 1;
  return 0;
}

function PitchDiagram({formation,xi}:{formation:string;xi:Player[]}) {
  const lines=[1,...formation.split("-").map(Number)];
  // Band by actual position, not array order, then place each row left→right by side.
  const ordered=[...xi].sort((a,b)=>posRank(a.pos)-posRank(b.pos));
  let idx=0;
  const rows=lines.map(size=>{
    const row=ordered.slice(idx,idx+size).sort((a,b)=>posSide(a.pos)-posSide(b.pos));
    idx+=size; return row;
  });
  const numRows=rows.length;
  return (
    <div className="wc-pitch">
      <div className="wc-pitch-circle"/><div className="wc-pitch-halfway"/>
      {rows.map((row,rowIdx)=>{
        // Keep the bottom row off the edge so the GK's name/club isn't clipped.
        const top=numRows>1?82-(rowIdx/(numRows-1))*72:50;
        return (
          <div className="wc-pitch-row" style={{top:`${top}%`}} key={rowIdx}>
            {row.map((p,i)=>{
              const isCap=!!(p.name&&p.name.includes("(C)"));
              const dname=p.name?p.name.replace(" (C)",""):null;
              return (
                <div className="wc-pitch-player" style={{left:`${((i+1)/(row.length+1))*100}%`}} key={i}>
                  <div className={`wc-pitch-dot${dname?"":" wc-pitch-dot-empty"}${isCap?" wc-pitch-dot-cap":""}`}>{p.pos}</div>
                  <div className="wc-pitch-name">{dname||p.pos}{isCap&&<span className="wc-pitch-cap"> (C)</span>}</div>
                  {dname&&<div className="wc-pitch-club">{p.club}</div>}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function TeamHub({team,groupResults,liveGoals,qualifiers,detailIds,onOpenDetail,onSelectTeam}:{
  team:Team;groupResults:Record<string,ScoreResult>;liveGoals:GoalEvent[];
  qualifiers:ReturnType<typeof computeQualifiers>|null;
  detailIds:Set<string>;onOpenDetail:(id:string)=>void;onSelectTeam:(code:string)=>void;
}) {
  const standings=computeStandings(team.group,groupResults);
  const pos=standings.findIndex(r=>r.code===team.code)+1;
  const row=standings[pos-1];
  const fixtures=fixturesForGroup(team.group)
    .filter(f=>f.homeCode===team.code||f.awayCode===team.code)
    .sort((a,b)=>a.matchday-b.matchday);
  const groupDone=groupIsComplete(team.group,groupResults);

  let status:{label:string;cls:string}|null=null;
  if(groupDone){
    if(pos<=2) status={label:"Advanced",cls:"in"};
    else if(pos===4) status={label:"Eliminated",cls:"out"};
    else if(qualifiers) status=qualifiers.bestThirds.some(t=>t.code===team.code)?{label:"Advanced · best 3rd",cls:"in"}:{label:"Eliminated",cls:"out"};
    else status={label:"3rd · awaiting other groups",cls:"pend"};
  }

  const scorers=useMemo(()=>{
    const m=new Map<string,number>();
    for(const g of liveGoals){ if(g.teamCode===team.code&&g.kind!=="owngoal") m.set(g.player,(m.get(g.player)??0)+1); }
    return [...m.entries()].sort((a,b)=>b[1]-a[1]);
  },[liveGoals,team.code]);

  if(!row || row.played===0) return <div className="wc-hub-empty">No matches played yet — group {team.group}.</div>;

  return (
    <div className="wc-hub">
      <div className="wc-hub-line">
        <span className="wc-hub-pos">{pos}<span className="wc-hub-pos-sup">{["st","nd","rd","th"][Math.min(pos-1,3)]}</span> in Group {team.group}</span>
        <span className="wc-hub-record">{row.win}W · {row.draw}D · {row.loss}L · {row.pts} pts · GD {fmtGD(row.gd)}</span>
        {status&&<span className={`wc-hub-status wc-hub-status-${status.cls}`}>{status.label}</span>}
      </div>

      <div className="wc-hub-results">
        {fixtures.map(f=>{
          const res=groupResults[f.id];
          const isHome=f.homeCode===team.code;
          const oppCode=isHome?f.awayCode:f.homeCode;
          const opp=TEAM_BY_CODE[oppCode];
          if(!res) return (
            <div className="wc-hub-result wc-hub-result-upcoming" key={f.id}>
              <span className="wc-hub-md">MD{f.matchday}</span>
              <button className="wc-hub-opp wc-hub-link" onClick={()=>onSelectTeam(oppCode)}><Flag code={opp.code} className="wc-flag-sm"/> {opp.name}</button>
              <span className="wc-hub-outcome wc-hub-pending">—</span>
            </div>
          );
          const tg=isHome?res.homeGoals:res.awayGoals;
          const og=isHome?res.awayGoals:res.homeGoals;
          const oc=tg>og?"W":tg<og?"L":"D";
          const clickable=detailIds.has(f.id);
          return (
            <div className={`wc-hub-result wc-hub-result-${oc}`} key={f.id}>
              <span className="wc-hub-md">MD{f.matchday}</span>
              <button className="wc-hub-opp wc-hub-link" onClick={()=>onSelectTeam(oppCode)}><Flag code={opp.code} className="wc-flag-sm"/> {opp.name}</button>
              {clickable
                ? <button className="wc-hub-outcome wc-hub-outcome-link" onClick={()=>onOpenDetail(f.id)} title="Match details">{oc} {tg}–{og} <span className="wc-hub-det">›</span></button>
                : <span className="wc-hub-outcome">{oc} {tg}–{og}</span>}
            </div>
          );
        })}
      </div>

      {scorers.length>0&&(
        <div className="wc-hub-scorers">
          <span className="wc-hub-scorers-label">Scorers</span>
          {scorers.map(([name,n])=><span key={name} className="wc-hub-scorer">{name}{n>1?` ×${n}`:""}</span>)}
        </div>
      )}
    </div>
  );
}

// The team's full group table, with their row highlighted and a jump-to-group link.
function GroupMiniTable({team,standings,qualifiers,onSelectTeam,onSelectGroup}:{
  team:Team;standings:StandingRow[];qualifiers:ReturnType<typeof computeQualifiers>|null;
  onSelectTeam:(code:string)=>void;onSelectGroup:(letter:string)=>void;
}){
  const bestThirdCodes=qualifiers?new Set(qualifiers.bestThirds.map(t=>t.code)):null;
  return (
    <div className="wc-team-group">
      <div className="wc-team-group-head">
        <span className="wc-team-group-title">Group {team.group} table</span>
        <button className="wc-team-group-link" onClick={()=>onSelectGroup(team.group)}>View group →</button>
      </div>
      <table className="wc-standings">
        <thead><tr><th></th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead>
        <tbody>
          {standings.map((t,i)=>{
            const cls=i<2?"wc-row-q":(i===2&&bestThirdCodes?.has(t.code))?"wc-row-third":"";
            return (
              <tr key={t.code} className={`${cls}${t.code===team.code?" wc-row-me":""}`}>
                <td className="wc-pos">{i+1}</td>
                <td><TeamChip team={t} onSelect={onSelectTeam}/></td>
                <td>{t.played}</td><td>{t.win}</td><td>{t.draw}</td><td>{t.loss}</td>
                <td>{fmtGD(t.gd)}</td><td className="wc-pts">{t.pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface OpenTeamVisibility { code:string; ratio:number; center:number; }

// A team's knockout run: each round they've reached (or are about to), with the real
// result + match details once played, a preview while upcoming, and a terminal outcome
// (eliminated / runners-up / champions) once the run ends.
const KO_RANK:Record<string,number>={R32:0,R16:1,QF:2,SF:3,"3P":4,F:4};
function TeamKnockoutPath({code,ko,koResults,liveByFixture,detailIds,onOpenDetail,onPreviewKo,onSelectTeam}:{
  code:string;ko:ResolvedKo[];koResults:Record<string,KoResult>;
  liveByFixture:Record<string,LiveGame>;detailIds:Set<string>;
  onOpenDetail:(id:string)=>void;onPreviewKo:(a:string,b:string,fixture:KoFixture)=>void;onSelectTeam:(c:string)=>void;
}){
  const steps=ko.filter(m=>m.home.team?.code===code||m.away.team?.code===code)
    .sort((a,b)=>(KO_RANK[a.fixture.round]??9)-(KO_RANK[b.fixture.round]??9));
  if(!steps.length) return null;
  const sideScore=(r:KoResult)=>{
    const tg=r.homeCode===code?r.homeGoals:r.awayGoals, og=r.homeCode===code?r.awayGoals:r.homeGoals;
    const pkT=r.homeCode===code?r.pkHome:r.pkAway, pkO=r.homeCode===code?r.pkAway:r.pkHome;
    const tied=tg===og, won=tg>og||(tied&&(pkT??0)>(pkO??0));
    return {tg,og,pkT,pkO,tied,won};
  };
  // Terminal outcome once there are no live/upcoming games left in the run.
  const alive=steps.some(m=>!koResults[m.fixture.id]);
  const lastPlayed=[...steps].reverse().find(m=>koResults[m.fixture.id]);
  let summary:{label:string;cls:string}|null=null;
  if(lastPlayed&&!alive){
    const {won}=sideScore(koResults[lastPlayed.fixture.id]); const rd=lastPlayed.fixture.round;
    if(rd==="F") summary=won?{label:"Champions 🏆",cls:"in"}:{label:"Runners-up",cls:"out"};
    else if(rd==="3P") summary=won?{label:"3rd place",cls:"in"}:{label:"4th place",cls:"out"};
    else if(!won) summary={label:`Out · ${KO_ROUND_LABEL[rd]}`,cls:"out"};
  }
  return (
    <div className="wc-team-ko">
      <div className="wc-team-ko-head"><span>Knockout run</span>{summary&&<span className={`wc-team-ko-tag wc-team-ko-tag-${summary.cls}`}>{summary.label}</span>}</div>
      {steps.map(m=>{
        const f=m.fixture, isHome=m.home.team?.code===code;
        const opp=isHome?m.away.team:m.home.team, oppLabel=isHome?m.away.label:m.home.label;
        const r=koResults[f.id], live=liveByFixture[f.id], canDetail=detailIds.has(f.id);
        let action:ReactNode;
        if(r){
          const s=sideScore(r); const pk=s.tied&&(s.pkT!=null||s.pkO!=null)?` (${s.pkT??0}-${s.pkO??0}p)`:"";
          action=<button className={`wc-team-ko-res${s.won?" win":" loss"}${canDetail?" wc-team-ko-link":""}`} onClick={canDetail?()=>onOpenDetail(f.id):undefined} disabled={!canDetail}>{s.won?"W":"L"} {s.tg}–{s.og}{pk}</button>;
        }else if(live){
          action=<button className={`wc-team-ko-res live${canDetail?" wc-team-ko-link":""}`} onClick={canDetail?()=>onOpenDetail(f.id):undefined} disabled={!canDetail}>LIVE {isHome?live.homeGoals:live.awayGoals}–{isHome?live.awayGoals:live.homeGoals}</button>;
        }else if(opp){
          action=<button className="wc-team-ko-preview" onClick={()=>onPreviewKo(code,opp.code,f)}>Preview ›</button>;
        }else{
          action=<span className="wc-team-ko-when">{formatKickoff(f.kickoff).date}</span>;
        }
        return (
          <div className="wc-team-ko-step" key={f.id}>
            <span className="wc-team-ko-round">{KO_ROUND_LABEL[f.round]}</span>
            <span className="wc-team-ko-opp">
              {opp
                ? <button className="wc-linklike" onClick={()=>onSelectTeam(opp.code)}><Flag code={opp.code} className="wc-flag-sm"/> {opp.name}</button>
                : <span className="wc-team-ko-tbd">{oppLabel}</span>}
            </span>
            {action}
          </div>
        );
      })}
    </div>
  );
}

function TeamNextGroupMatch({team,groupResults,liveByFixture,detailIds,onOpenDetail,onPreviewGroup,onSelectTeam}:{
  team:Team;groupResults:Record<string,ScoreResult>;liveByFixture:Record<string,LiveGame>;detailIds:Set<string>;
  onOpenDetail:(id:string)=>void;onPreviewGroup:(id:string)=>void;onSelectTeam:(code:string)=>void;
}){
  const next=fixturesForGroup(team.group)
    .filter(f=>(f.homeCode===team.code||f.awayCode===team.code)&&!groupResults[f.id])
    .sort((a,b)=>a.kickoff.localeCompare(b.kickoff))[0];
  if(!next) return null;
  const isHome=next.homeCode===team.code;
  const opp=TEAM_BY_CODE[isHome?next.awayCode:next.homeCode];
  const live=liveByFixture[next.id];
  const k=formatKickoff(next.kickoff);
  return (
    <div className="wc-team-ko wc-team-next">
      <div className="wc-team-ko-head"><span>Next group match</span><span className="wc-team-ko-tag wc-team-ko-tag-pend">MD{next.matchday}</span></div>
      <div className="wc-team-ko-step">
        <span className="wc-team-ko-round">Group {team.group}</span>
        <span className="wc-team-ko-opp">
          <button className="wc-linklike" onClick={()=>onSelectTeam(opp.code)}><Flag code={opp.code} className="wc-flag-sm"/> {opp.name}</button>
        </span>
        {live
          ? <button className="wc-team-ko-res live wc-team-ko-link" onClick={()=>onOpenDetail(next.id)}>LIVE {isHome?live.homeGoals:live.awayGoals}–{isHome?live.awayGoals:live.homeGoals}</button>
          : <button className="wc-team-ko-preview" onClick={()=>detailIds.has(next.id)?onOpenDetail(next.id):onPreviewGroup(next.id)}>{detailIds.has(next.id)?"Details":"Preview"} ›</button>}
      </div>
      <div className="wc-team-next-sub">{k.date} · {k.time} · {next.venue}</div>
    </div>
  );
}

function TeamProfileCard({team,focusKey,groupResults,liveGoals,qualifiers,confirmed,ko,koResults,liveByFixture,onPreviewKo,onPreviewGroup,detailIds,onOpenDetail,onSelectTeam,onSelectGroup,onOpenVisibility}:{
  team:Team;focusKey:number|null;
  groupResults:Record<string,ScoreResult>;liveGoals:GoalEvent[];
  qualifiers:ReturnType<typeof computeQualifiers>|null;
  confirmed?:ConfirmedXI;
  ko:ResolvedKo[];koResults:Record<string,KoResult>;liveByFixture:Record<string,LiveGame>;
  onPreviewKo:(a:string,b:string,fixture:KoFixture)=>void;onPreviewGroup:(id:string)=>void;
  detailIds:Set<string>;onOpenDetail:(id:string)=>void;onSelectTeam:(code:string)=>void;onSelectGroup:(letter:string)=>void;
  onOpenVisibility:(v:OpenTeamVisibility|null)=>void;
}) {
  const profile=TEAM_PROFILES[team.code];
  const tier=tierForRank(team.fifaRank);
  const confed=CONFED[team.confed];
  const coach=COACHES[team.code];
  const captain=captainOf(team.code);
  const [open,setOpen]=useState(false);
  const ref=useRef<HTMLDivElement|null>(null);
  const toggle=()=>setOpen(o=>!o);
  useEffect(()=>{
    if(focusKey!=null){ setOpen(true); ref.current?.scrollIntoView({behavior:"smooth",block:"start"}); }
  },[focusKey]); // eslint-disable-line
  useEffect(()=>{
    const el=ref.current;
    if(!open||!el){ onOpenVisibility(null); return; }
    const report=()=>{
      const r=el.getBoundingClientRect();
      const visible=Math.max(0,Math.min(window.innerHeight,r.bottom)-Math.max(0,r.top));
      const ratio=r.height>0?visible/r.height:0;
      const center=Math.abs((r.top+r.bottom)/2-window.innerHeight/2);
      onOpenVisibility({code:team.code,ratio,center});
    };
    report();
    const observer=new IntersectionObserver(report,{threshold:[0,.1,.25,.5,.75,1]});
    observer.observe(el);
    window.addEventListener("scroll",report,{passive:true});
    window.addEventListener("resize",report);
    return ()=>{
      observer.disconnect();
      window.removeEventListener("scroll",report);
      window.removeEventListener("resize",report);
      onOpenVisibility(null);
    };
  },[open,team.code,onOpenVisibility]);
  if(!profile)return null;
  // Prefer ESPN's published XI when we have one; otherwise fall back to the predicted squad.
  const formation=confirmed?.formation || profile.formation;
  const xi=confirmed?.xi ?? profile.xi;
  const confirmedFx=confirmed?FIXTURE_BY_ID[confirmed.fixtureId]:undefined;
  const confirmedLabel=confirmedFx?`Possible XI · last out MD${confirmedFx.matchday} v ${confirmedFx.homeCode===team.code?confirmedFx.awayCode:confirmedFx.homeCode}`:"Possible XI";
  const groupStandings=open?computeStandings(team.group,groupResults):[]; // only when expanded
  const microFacts=useMemo(()=>buildTeamMicroFacts(team,groupResults,liveGoals,qualifiers,ko,koResults,liveByFixture,confirmed),[team,groupResults,liveGoals,qualifiers,ko,koResults,liveByFixture,confirmed]);
  const microFallback=useMemo(()=>fallbackTeamMicro(team,groupResults,qualifiers),[team,groupResults,qualifiers]);
  const microKey=useMemo(()=>`team:${team.code}:${digestCacheKey(microFacts)}`,[team.code,microFacts]);
  const groupComplete=groupIsComplete(team.group,groupResults);
  return (
    <div className="wc-team-card" ref={ref}>
      <button className="wc-team-card-head" onClick={toggle}>
        <Flag code={team.code} className="wc-team-flag-lg"/>
        <span className="wc-team-card-title">
          <span className="wc-team-card-name">{team.name}</span>
          <span className="wc-team-card-meta">FIFA #{team.fifaRank} · {tier.label} · Group {team.group}</span>
        </span>
        <StarRating stars={tier.stars}/>
        {open?<ChevronUp size={16}/>:<ChevronDown size={16}/>}
      </button>
      {open&&(
        <div className="wc-team-card-body">
          <div className="wc-team-chips">
            <span className="wc-team-chip" style={{borderColor:confed.color,color:confed.color}}>{confed.label}</span>
            {coach&&<span className="wc-team-chip"><span className="wc-team-chip-k">Coach</span> {coach}</span>}
            {captain&&<span className="wc-team-chip"><span className="wc-team-chip-k">Captain</span> {captain}</span>}
            <span className="wc-team-chip"><span className="wc-team-chip-k">Formation</span> {formation}</span>
          </div>

          <TeamHub team={team} groupResults={groupResults} liveGoals={liveGoals} qualifiers={qualifiers}
            detailIds={detailIds} onOpenDetail={onOpenDetail} onSelectTeam={onSelectTeam}/>

          <MicroDigest facts={microFacts} cacheKey={microKey} fallback={microFallback} tone="team"
            onSelectTeam={onSelectTeam} onSelectGroup={onSelectGroup}/>

          <GroupMiniTable team={team} standings={groupStandings} qualifiers={qualifiers}
            onSelectTeam={onSelectTeam} onSelectGroup={onSelectGroup}/>

          {groupComplete
            ? <TeamKnockoutPath code={team.code} ko={ko} koResults={koResults} liveByFixture={liveByFixture}
                detailIds={detailIds} onOpenDetail={onOpenDetail} onPreviewKo={onPreviewKo} onSelectTeam={onSelectTeam}/>
            : <TeamNextGroupMatch team={team} groupResults={groupResults} liveByFixture={liveByFixture}
                detailIds={detailIds} onOpenDetail={onOpenDetail} onPreviewGroup={onPreviewGroup} onSelectTeam={onSelectTeam}/>}

          <div className="wc-team-body-grid">
            <div className="wc-team-body-text">
              <p className="wc-team-narrative">{profile.narrative}</p>
              <div className="wc-team-formation-row">
                <span className={`wc-lineup-badge${confirmed?" wc-lineup-confirmed":""}`}>
                  {confirmed?confirmedLabel:"Predicted XI"}
                </span>
              </div>
            </div>
            <div className="wc-team-pitch-wrap" style={pitchAccentStyle(team.code)}>
              <PitchDiagram formation={formation} xi={xi}/>
            </div>
          </div>

          <button className="wc-team-collapse" onClick={()=>{ setOpen(false); ref.current?.scrollIntoView({behavior:"smooth",block:"start"}); }}>
            <ChevronUp size={14}/> Minimize {team.name}
          </button>
        </div>
      )}
    </div>
  );
}

const GOAL_TAG:Partial<Record<GoalKind,string>>={penalty:" (P)",owngoal:" (OG)",header:" (H)",freekick:" (FK)"};
function goalLine(g:GoalEvent){ return `${g.player} ${g.minute}${GOAL_TAG[g.kind]??""}`; }

// Read-only match card (live tracker — scores come from the feed, never entered).
function MatchCard({match, result, isKnockout=false, teamA, teamB, goals, onSelectTeam, canDetail, onOpenDetail, live, homeLabel, awayLabel, onOpenPreview, onOpenKoPreview}:{
  match:{id:string;kickoff?:string;venue?:string;city?:string};
  result?:ScoreResult;
  isKnockout?:boolean;
  teamA:Team|StandingRow|null;
  teamB:Team|StandingRow|null;
  goals?:GoalEvent[];
  onSelectTeam?:(code:string)=>void;
  canDetail?:boolean;
  onOpenDetail?:(id:string)=>void;
  live?:LiveGame;
  homeLabel?:string;   // knockout slot descriptor (e.g. "Winner A", "3rd A/B/C/D/F")
  awayLabel?:string;
  onOpenPreview?:(id:string)=>void;
  onOpenKoPreview?:()=>void;   // knockout matchup preview (both teams resolved)
}) {
  const kickoff=match.kickoff?formatKickoff(match.kickoff):null;
  const showLive=!!live&&result==null;
  const homeScorers=goals&&teamA?goals.filter(g=>g.teamCode===teamA.code):[];
  const awayScorers=goals&&teamB?goals.filter(g=>g.teamCode===teamB.code):[];
  const hasScorers=(homeScorers.length+awayScorers.length)>0;
  const played=result!=null;
  const hg=played?result!.homeGoals:showLive?live!.homeGoals:null;
  const ag=played?result!.awayGoals:showLive?live!.awayGoals:null;
  const tied=played&&result!.homeGoals===result!.awayGoals;
  const pkHomeWin=tied&&(result?.pkHome??0)>(result?.pkAway??0);
  const pkAwayWin=tied&&(result?.pkAway??0)>(result?.pkHome??0);
  const homeWin=(hg!=null&&ag!=null&&hg>ag)||pkHomeWin;
  const awayWin=(hg!=null&&ag!=null&&ag>hg)||pkAwayWin;

  const canPlay=!!(teamA&&teamB);
  const seedA=homeLabel??(isKnockout?seedLabel(teamA):null);
  const seedB=awayLabel??(isKnockout?seedLabel(teamB):null);

  return (
    <div className={`wc-match-card${played?" wc-match-card-played":""}${!canPlay?" wc-match-card-tbd":""}${showLive?" wc-match-card-live":""}`}>
      {showLive&&(
        <span className="wc-match-livetag"><span className="wc-live-dot"/>LIVE {live!.clock||live!.status}</span>
      )}
      {(kickoff||match.venue)&&(
        <div className="wc-match-meta">
          {kickoff&&<span className="wc-match-when">{kickoff.date} · {kickoff.time}</span>}
          {match.venue&&<span className="wc-match-where">{match.venue}{match.city?` · ${match.city}`:""}</span>}
        </div>
      )}
      <div className="wc-match-body">
        <div className={`wc-match-side${homeWin?" wc-match-side-win":awayWin?" wc-match-side-loss":""}`}>
          {teamA
            ? <><Flag code={teamA.code} className="wc-match-flag"/>
                {onSelectTeam
                  ? <button className="wc-match-name wc-match-name-link" onClick={()=>onSelectTeam(teamA.code)}>{teamA.name}</button>
                  : <span className="wc-match-name">{teamA.name}</span>}
                {seedA&&<span className="wc-match-seed">{seedA}</span>}</>
            : <span className="wc-match-name wc-match-name-tbd">{homeLabel??"TBD"}</span>
          }
        </div>

        <div className="wc-match-center">
          {hg!=null&&ag!=null
            ? <span className={`wc-match-score${showLive?" wc-match-score-live":""}`}>{hg}<span className="wc-match-score-sep">–</span>{ag}</span>
            : <span className="wc-match-vs">{kickoff?kickoff.time:"vs"}</span>
          }
          {played&&tied&&isKnockout&&<span className="wc-match-et">AET</span>}
          {showLive&&<span className="wc-match-et">{live!.clock||live!.status}</span>}
        </div>

        <div className={`wc-match-side wc-match-side-right${awayWin?" wc-match-side-win":homeWin?" wc-match-side-loss":""}`}>
          {teamB
            ? <>{onSelectTeam
                  ? <button className="wc-match-name wc-match-name-link" onClick={()=>onSelectTeam(teamB.code)}>{teamB.name}</button>
                  : <span className="wc-match-name">{teamB.name}</span>}
                <Flag code={teamB.code} className="wc-match-flag"/>
                {seedB&&<span className="wc-match-seed">{seedB}</span>}</>
            : <span className="wc-match-name wc-match-name-tbd">{awayLabel??"TBD"}</span>
          }
        </div>
      </div>

      {hasScorers&&(
        <div className="wc-match-goals">
          <div className="wc-match-goals-side">
            {homeScorers.map((g,i)=><span key={i} className="wc-goal-row">{goalLine(g)}<BallIcon size={10} className="wc-goal-ball"/></span>)}
          </div>
          <div className="wc-match-goals-side wc-match-goals-right">
            {awayScorers.map((g,i)=><span key={i} className="wc-goal-row"><BallIcon size={10} className="wc-goal-ball"/>{goalLine(g)}</span>)}
          </div>
        </div>
      )}

      {isKnockout&&tied&&played&&(result!.pkHome!=null||result!.pkAway!=null)&&(
        <div className="wc-match-pk">
          <span className="wc-pk-label">Penalties {result!.pkHome??0}–{result!.pkAway??0}</span>
          {(pkHomeWin||pkAwayWin)&&(
            <span className="wc-pk-winner">{pkHomeWin?teamA?.name:teamB?.name} win on penalties</span>
          )}
        </div>
      )}

      {canDetail&&(played||showLive)&&onOpenDetail&&(
        <button className="wc-match-detail-btn" onClick={()=>onOpenDetail(match.id)}>
          Match details ›
        </button>
      )}
      {!isKnockout&&!played&&!showLive&&teamA&&teamB&&onOpenPreview&&(
        <button className="wc-match-detail-btn" onClick={()=>onOpenPreview(match.id)}>
          Match preview ›
        </button>
      )}
      {isKnockout&&!played&&!showLive&&teamA&&teamB&&onOpenKoPreview&&(
        <button className="wc-match-detail-btn" onClick={onOpenKoPreview}>
          Match preview ›
        </button>
      )}
    </div>
  );
}

function GroupCard({letter,standings,groupResults,qualifiers,goalsByFixture,onSelectTeam,detailIds,onOpenDetail,onOpenPreview,liveByFixture,showFixtures,onToggleFixtures,flash}:{
  letter:string;standings:StandingRow[];groupResults:Record<string,ScoreResult>;
  qualifiers:ReturnType<typeof computeQualifiers>|null;
  goalsByFixture:Record<string,GoalEvent[]>;
  onSelectTeam:(code:string)=>void;
  detailIds:Set<string>;
  onOpenDetail:(id:string)=>void;
  onOpenPreview:(id:string)=>void;
  liveByFixture:Record<string,LiveGame>;
  showFixtures:boolean;
  onToggleFixtures:()=>void;
  flash?:boolean;
}) {
  const complete=groupIsComplete(letter,groupResults);
  const played=fixturesForGroup(letter).filter(m=>groupResults[m.id]).length;
  const bestThirdCodes=qualifiers?new Set(qualifiers.bestThirds.map(t=>t.code)):null;
  const fixtures=fixturesForGroup(letter);

  return (
    <div className={`wc-group-card${flash?" wc-group-flash":""}`} id={`wc-group-${letter}`}>
      <div className="wc-group-head">
        <span className="wc-group-letter">{letter}</span>
        <span className={`wc-group-pill${complete?" wc-group-pill-done":""}`}>
          {complete?<><Check size={11}/> Done</>:`${played}/6`}
        </span>
      </div>
      <table className="wc-standings">
        <thead><tr><th></th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead>
        <tbody>
          {standings.map((t,i)=>{
            const cls=i<2?"wc-row-q":(i===2&&bestThirdCodes?.has(t.code))?"wc-row-third":complete?"wc-row-out":"";
            return (
              <tr key={t.code} className={cls}>
                <td className="wc-pos">{i+1}</td>
                <td><TeamChip team={t} onSelect={onSelectTeam}/></td>
                <td>{t.played}</td><td>{t.win}</td><td>{t.draw}</td><td>{t.loss}</td>
                <td>{fmtGD(t.gd)}</td><td className="wc-pts">{t.pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button className="wc-toggle-btn" onClick={onToggleFixtures}>
        {showFixtures?<ChevronUp size={12}/>:<ChevronDown size={12}/>}
        {showFixtures?"Hide matches":"Show matches"}
      </button>
      {showFixtures&&(
        <div className="wc-group-matches">
          {[1,2,3].map(md=>(
            <div key={md} className="wc-matchday">
              <div className="wc-matchday-label">Matchday {md}</div>
              {fixtures.filter(f=>f.matchday===md).map(m=>(
                <MatchCard key={m.id} match={m} result={groupResults[m.id]}
                  teamA={TEAM_BY_CODE[m.homeCode]}
                  teamB={TEAM_BY_CODE[m.awayCode]}
                  goals={goalsByFixture[m.id]}
                  onSelectTeam={onSelectTeam}
                  canDetail={detailIds.has(m.id)}
                  onOpenDetail={onOpenDetail}
                  onOpenPreview={onOpenPreview}
                  live={liveByFixture[m.id]}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleView({groupResults,onSelectTeam,detailIds,onOpenDetail,onOpenPreview,liveByFixture}:{
  groupResults:Record<string,ScoreResult>;
  onSelectTeam:(code:string)=>void;
  detailIds:Set<string>;
  onOpenDetail:(id:string)=>void;
  onOpenPreview:(id:string)=>void;
  liveByFixture:Record<string,LiveGame>;
}) {
  const localKey=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const days=useMemo(()=>{
    const sorted=[...ALL_GROUP_MATCHES].sort((a,b)=>a.kickoff.localeCompare(b.kickoff));
    const out:{day:string;key:string;matches:Fixture[]}[]=[];
    for(const f of sorted){
      const d=new Date(f.kickoff);
      const key=localKey(d);
      const day=d.toLocaleDateString(undefined,{weekday:"long",month:"short",day:"numeric"});
      const last=out[out.length-1];
      if(last&&last.key===key) last.matches.push(f);
      else out.push({day,key,matches:[f]});
    }
    return out;
  },[]);

  const dayRefs=useRef<Record<string,HTMLDivElement|null>>({});
  const todayKey=localKey(new Date());
  const hasToday=days.some(d=>d.key===todayKey);
  const jumpToToday=()=>{
    const target=days.find(d=>d.key===todayKey)??days.find(d=>d.key>todayKey)??days[days.length-1];
    if(target) dayRefs.current[target.key]?.scrollIntoView({behavior:"smooth",block:"start"});
  };

  return (
    <div className="wc-schedule">
      <div className="wc-sched-bar">
        <button className="wc-btn-ghost-sm" onClick={jumpToToday}>
          <CalendarClock size={14}/> {hasToday?"Jump to today’s games":"Jump to next games"}
        </button>
      </div>
      {days.map(({day,key,matches})=>(
        <div className="wc-sched-day" key={key} ref={el=>{ dayRefs.current[key]=el; }}>
          <div className="wc-sched-day-head">{day}{key===todayKey&&<span className="wc-sched-today">Today</span>}</div>
          {matches.map(f=>{
            const res=groupResults[f.id];
            const lg=liveByFixture[f.id];
            const live=lg&&!res;
            const home=TEAM_BY_CODE[f.homeCode], away=TEAM_BY_CODE[f.awayCode];
            const k=formatKickoff(f.kickoff);
            const hg=res?res.homeGoals:lg?.homeGoals, ag=res?res.awayGoals:lg?.awayGoals;
            const hw=hg!=null&&ag!=null&&hg>ag;
            const aw=hg!=null&&ag!=null&&ag>hg;
            const detailable=detailIds.has(f.id)||(!!live&&!!lg?.eventId);
            const previewable=!res&&!live;
            const clickable=detailable||previewable;
            const onRowClick=detailable?()=>onOpenDetail(f.id):previewable?()=>onOpenPreview(f.id):undefined;
            return (
              <div className={`wc-sched-row${clickable?" wc-sched-row-link":""}${live?" wc-sched-row-live":""}`} key={f.id}
                onClick={onRowClick}
                role={clickable?"button":undefined} tabIndex={clickable?0:undefined}>
                <div className="wc-sched-main">
                  <span className={`wc-sched-side${hw?" wc-sched-win":aw?" wc-sched-lose":""}`}>
                    <button className="wc-sched-name" onClick={(e)=>{e.stopPropagation();onSelectTeam(f.homeCode);}}>{home.name}</button>
                    <Flag code={f.homeCode} className="wc-sched-flag"/>
                  </span>
                  <span className="wc-sched-mid">
                    {res||live
                      ? <span className={`wc-sched-score${live?" wc-sched-score-live":""}`}>{hg}<span className="wc-sched-dash">–</span>{ag}</span>
                      : <span className="wc-sched-time">{k.time}</span>}
                  </span>
                  <span className={`wc-sched-side wc-sched-side-r${aw?" wc-sched-win":hw?" wc-sched-lose":""}`}>
                    <Flag code={f.awayCode} className="wc-sched-flag"/>
                    <button className="wc-sched-name" onClick={(e)=>{e.stopPropagation();onSelectTeam(f.awayCode);}}>{away.name}</button>
                  </span>
                </div>
                <div className="wc-sched-sub">
                  {live&&<span className="wc-sched-livetag"><span className="wc-live-dot"/>LIVE {lg!.clock||lg!.status}</span>}
                  <span className="wc-sched-grp">Grp {f.group} · MD{f.matchday}</span>
                  <span className="wc-sched-venue">{f.venue}, {f.city}</span>
                  {detailable?<span className="wc-sched-chev">Match details ›</span>:previewable?<span className="wc-sched-chev">Match preview ›</span>:null}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function GroupsView({groupResults,qualifiers,goalsByFixture,onSelectTeam,detailIds,onOpenDetail,onOpenPreview,liveByFixture,focusGroup}:{
  groupResults:Record<string,ScoreResult>;
  qualifiers:ReturnType<typeof computeQualifiers>|null;
  goalsByFixture:Record<string,GoalEvent[]>;
  onSelectTeam:(code:string)=>void;
  detailIds:Set<string>;
  onOpenDetail:(id:string)=>void;
  onOpenPreview:(id:string)=>void;
  liveByFixture:Record<string,LiveGame>;
  focusGroup:{letter:string;k:number}|null;
}) {
  const [view,setView]=useState<"tables"|"schedule">("tables");
  // Standings are computed once per results change and shared with every card, instead of
  // each of the 12 GroupCards recomputing on every render (toggles, polls, etc.).
  const standingsByGroup=useMemo(()=>Object.fromEntries(
    GROUP_LETTERS.map(l=>[l,computeStandings(l,groupResults)])
  ) as Record<string,StandingRow[]>,[groupResults]);
  // matches collapsed by default — a clean grid of 12 tables, far less dense
  const [expanded,setExpanded]=useState<Record<string,boolean>>({});
  const allShown=GROUP_LETTERS.every(l=>expanded[l]);
  const toggleAll=()=>setExpanded(Object.fromEntries(GROUP_LETTERS.map(l=>[l,!allShown])));
  const toggleOne=(l:string)=>setExpanded(p=>({...p,[l]:!p[l]}));

  // Deep-linked from the digest: jump to tables, highlight + scroll the group into view.
  const [flash,setFlash]=useState<string|null>(null);
  useEffect(()=>{
    if(!focusGroup) return;
    const l=focusGroup.letter;
    setView("tables"); setFlash(l);
    const t=setTimeout(()=>{
      document.getElementById(`wc-group-${l}`)?.scrollIntoView({behavior:"smooth",block:"center"});
    },60);
    const clear=setTimeout(()=>setFlash(null),2000);
    return ()=>{ clearTimeout(t); clearTimeout(clear); };
  },[focusGroup?.k]); // eslint-disable-line

  return (
    <>
      <div className="wc-groups-bar">
        <div className="wc-view-switch">
          <button className={`wc-view-btn${view==="tables"?" wc-view-active":""}`} onClick={()=>setView("tables")}>Tables</button>
          <button className={`wc-view-btn${view==="schedule"?" wc-view-active":""}`} onClick={()=>setView("schedule")}>Schedule</button>
        </div>
        {view==="tables"&&(
          <button className="wc-btn-ghost-sm" onClick={toggleAll}>
            {allShown?<ChevronUp size={14}/>:<ChevronDown size={14}/>} {allShown?"Hide all matches":"Show all matches"}
          </button>
        )}
      </div>
      {view==="tables"?(
        <div className="wc-groups-grid">
          {GROUP_LETTERS.map(letter=>(
            <GroupCard key={letter} letter={letter} standings={standingsByGroup[letter]} groupResults={groupResults}
              qualifiers={qualifiers}
              goalsByFixture={goalsByFixture} onSelectTeam={onSelectTeam}
              detailIds={detailIds} onOpenDetail={onOpenDetail} onOpenPreview={onOpenPreview} liveByFixture={liveByFixture}
              showFixtures={!!expanded[letter]} onToggleFixtures={()=>toggleOne(letter)} flash={flash===letter}/>
          ))}
        </div>
      ):(
        <ScheduleView groupResults={groupResults} onSelectTeam={onSelectTeam}
          detailIds={detailIds} onOpenDetail={onOpenDetail} onOpenPreview={onOpenPreview} liveByFixture={liveByFixture}/>
      )}
    </>
  );
}

function ThirdPlaceTableView({groupResults,liveByFixture,onSelectTeam}:{groupResults:Record<string,ScoreResult>;liveByFixture:Record<string,LiveGame>;onSelectTeam:(code:string)=>void}) {
  // Fold in-progress games into the standings so the table reflects results "as it stands".
  const liveIds=Object.keys(liveByFixture);
  const effectiveResults=useMemo(()=>{
    const merged:Record<string,ScoreResult>={...groupResults};
    for(const lg of Object.values(liveByFixture)){
      merged[lg.fixtureId]={homeGoals:lg.homeGoals,awayGoals:lg.awayGoals};
    }
    return merged;
  },[groupResults,liveByFixture]);
  // teams currently playing a live match — flagged in the table
  const liveCodes=useMemo(()=>{
    const s=new Set<string>();
    for(const lg of Object.values(liveByFixture)){ s.add(lg.homeCode); s.add(lg.awayCode); }
    return s;
  },[liveByFixture]);

  const allThirds=useMemo(()=>{
    const pool:StandingRow[]=[];
    GROUP_LETTERS.forEach(letter=>{
      const s=computeStandings(letter,effectiveResults);
      if(s[2]) pool.push({...s[2],origin:letter});
    });
    pool.sort((a,b)=>(b.pts-a.pts)||(b.gd-a.gd)||(b.gf-a.gf)||(b.rating-a.rating));
    return pool;
  },[effectiveResults]);

  const completedGroups=GROUP_LETTERS.filter(l=>groupIsComplete(l,groupResults)).length;
  const advancingCodes=new Set(allThirds.slice(0,8).map(t=>t.code));

  return (
    <div className="wc-thirds-view">
      <div className="wc-thirds-explainer">
        <div className="wc-explainer-header">
          <span className="wc-explainer-emoji"><Ticket size={26}/></span>
          <div>
            <div className="wc-explainer-title">The third-place wildcard</div>
            <div className="wc-explainer-sub">A 2026-specific twist that keeps every match alive</div>
          </div>
        </div>
        <div className="wc-explainer-body">
          <p>
            For the first time ever, the World Cup has <strong>48 teams</strong> across <strong>12 groups of 4</strong>.
            That creates a math problem: 12 groups × 2 automatic qualifiers = 24 teams — but the Round of 32 needs exactly 32.
            So FIFA added a wildcard: the <strong>8 best third-placed teams</strong> across all 12 groups also advance.
          </p>
          <p>
            Third-place teams are ranked by points, then goal difference, then goals scored — which means finishing third is no
            longer a death sentence. And it means <strong>every last game matters</strong>, even for a team already out of
            contention for first or second. Chase goals — they might be the difference between this row turning gold or staying grey.
          </p>
        </div>
        <div className="wc-explainer-stats">
          <div className="wc-explainer-stat"><span className="wc-explainer-stat-num">12</span><span className="wc-explainer-stat-label">groups</span></div>
          <div className="wc-explainer-stat"><span className="wc-explainer-stat-num">24</span><span className="wc-explainer-stat-label">auto qualifiers</span></div>
          <div className="wc-explainer-stat"><span className="wc-explainer-stat-num">8</span><span className="wc-explainer-stat-label">best thirds qualify</span></div>
          <div className="wc-explainer-stat"><span className="wc-explainer-stat-num">4</span><span className="wc-explainer-stat-label">thirds eliminated</span></div>
        </div>
      </div>

      <div className="wc-thirds-table-wrap">
        <div className="wc-thirds-table-header">
          <span>All third-placed teams {liveIds.length>0&&<span className="wc-thirds-live-tag">· as it stands</span>}</span>
          <span className="wc-thirds-progress">{completedGroups} / 12 groups complete</span>
        </div>
        {allThirds.length===0?(
          <div className="wc-thirds-empty">Enter match scores to see third-place standings appear here.</div>
        ):(
          <table className="wc-standings wc-thirds-table">
            <thead><tr><th></th><th>Team</th><th>Grp</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th><th></th></tr></thead>
            <tbody>
              {allThirds.map((t,i)=>(
                <tr key={t.code} className={advancingCodes.has(t.code)?"wc-row-through":"wc-row-out"}>
                  <td className="wc-pos">{i+1}</td>
                  <td><TeamChip team={t} onSelect={onSelectTeam}/>{liveCodes.has(t.code)&&<span className="wc-thirds-live-dot" title="Currently playing">LIVE</span>}</td>
                  <td className="wc-thirds-grp">{t.origin}</td>
                  <td>{t.played}</td><td>{t.win}</td><td>{t.draw}</td><td>{t.loss}</td>
                  <td>{fmtGD(t.gd)}</td><td className="wc-pts">{t.pts}</td>
                  <td>{advancingCodes.has(t.code)
                    ?<span className="wc-badge-through"><Check size={10}/> In</span>
                    :<span className="wc-badge-out">Out</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {allThirds.length>0&&allThirds.length<12&&(
          <p className="wc-thirds-note">The cutoff line shifts as more groups complete — keep entering scores.</p>
        )}
      </div>
    </div>
  );
}


// Compact bracket card: two team rows (flag · name · score) + a small footer.
function BracketCard({m,result,live,onOpen}:{
  m:ResolvedKo;result?:KoResult;live?:LiveGame;onOpen:(m:ResolvedKo)=>void;
}){
  const f=m.fixture;
  const win=result?koWinnerCode(result):null;
  const goalFor=(code?:string)=>{
    if(!code) return null;
    if(result) return result.homeCode===code?result.homeGoals:result.awayCode===code?result.awayGoals:null;
    if(live) return live.homeCode===code?live.homeGoals:live.awayCode===code?live.awayGoals:null;
    return null;
  };
  const pkFor=(code?:string)=>result&&result.homeGoals===result.awayGoals&&code?(result.homeCode===code?result.pkHome:result.pkAway):undefined;
  const teamRow=(side:KoSide)=>{
    const t=side.team, g=goalFor(t?.code), pk=pkFor(t?.code);
    return (
      <div className={`wc-br2-team${t&&win===t.code?" wc-br2-win":""}${t?"":" wc-br2-tbd"}`}>
        {t?<Flag code={t.code} className="wc-br2-flag"/>:<span className="wc-br2-flag-x"/>}
        <span className="wc-br2-name">{t?t.code:"TBD"}</span>
        {g!=null&&<span className="wc-br2-score">{g}{pk!=null?<span className="wc-br2-pk"> ({pk})</span>:null}</span>}
      </div>
    );
  };
  const shortDate=(()=>{const d=new Date(f.kickoff);return isNaN(d.getTime())?"":d.toLocaleDateString(undefined,{month:"short",day:"numeric"});})();
  const foot=result?"FT":live?<span className="wc-br2-live"><span className="wc-live-dot"/>{live.clock||"LIVE"}</span>:shortDate;
  return (
    <button className="wc-br2-card" onClick={()=>onOpen(m)} title={m.home.team&&m.away.team?`${m.home.team.name} v ${m.away.team.name}`:"Match"}>
      <div className="wc-br2-teams">{teamRow(m.home)}{teamRow(m.away)}</div>
      <div className="wc-br2-foot">{foot}</div>
    </button>
  );
}

function KoBracket({ko,koResults,liveByFixture,detailIds,onOpenDetail,onSelectTeam,onPreviewKo}:{
  ko:ResolvedKo[];koResults:Record<string,KoResult>;liveByFixture:Record<string,LiveGame>;goalsByFixture:Record<string,GoalEvent[]>;
  detailIds:Set<string>;onOpenDetail:(id:string)=>void;onSelectTeam:(code:string)=>void;onPreviewKo:(a:string,b:string,fixture:KoFixture)=>void;
}){
  const byId=useMemo(()=>Object.fromEntries(ko.map(m=>[m.fixture.id,m])) as Record<string,ResolvedKo>,[ko]);
  const wrapRef=useRef<HTMLDivElement|null>(null);
  const finalRef=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{
    const centerFinal=()=>{
      const wrap=wrapRef.current;
      const final=finalRef.current;
      if(!wrap||!final) return;
      const target=final.offsetLeft+(final.offsetWidth/2)-(wrap.clientWidth/2);
      wrap.scrollTo({left:Math.max(0,target),behavior:"auto"});
    };
    const raf=requestAnimationFrame(centerFinal);
    window.addEventListener("resize",centerFinal);
    return ()=>{
      cancelAnimationFrame(raf);
      window.removeEventListener("resize",centerFinal);
    };
  },[ko.length]);
  const open=(m:ResolvedKo)=>{
    const id=m.fixture.id;
    if(koResults[id]||detailIds.has(id)||liveByFixture[id]) onOpenDetail(id);
    else if(m.home.team&&m.away.team) onPreviewKo(m.home.team.code,m.away.team.code,m.fixture);
  };
  const cardFor=(id:string)=>{ const m=byId[id]; if(!m) return null;
    return <div className="wc-br2-match" key={id}><BracketCard m={m} result={koResults[id]} live={liveByFixture[id]} onOpen={open}/></div>;
  };
  void onSelectTeam; // kept in props for caller compatibility; cards open the match, not a team
  const col=(round:string,ids:string[],side:"l"|"r",kind:"src"|"single",hasIn:boolean)=>(
    <div className={`wc-br2-col wc-br2-${side} wc-br2-${kind}${hasIn?" wc-br2-in":""}`} key={`${side}-${round}`}>
      <div className="wc-br2-head">{KO_ROUND_LABEL[round]}</div>
      <div className="wc-br2-body">{ids.map(cardFor)}</div>
    </div>
  );
  return (
    <>
      <div className="wc-br2-wrap" ref={wrapRef}>
        <div className="wc-br2">
          {col("R32",LEFT_ORDER.R32,"l","src",false)}
          {col("R16",LEFT_ORDER.R16,"l","src",true)}
          {col("QF",LEFT_ORDER.QF,"l","src",true)}
          {col("SF",LEFT_ORDER.SF,"l","single",true)}
          <div className="wc-br2-col wc-br2-c wc-br2-final" ref={finalRef}>
            <div className="wc-br2-head">{KO_ROUND_LABEL.F}</div>
            <div className="wc-br2-body">{cardFor("ko-F-1")}</div>
          </div>
          {col("SF",RIGHT_ORDER.SF,"r","single",true)}
          {col("QF",RIGHT_ORDER.QF,"r","src",true)}
          {col("R16",RIGHT_ORDER.R16,"r","src",true)}
          {col("R32",RIGHT_ORDER.R32,"r","src",false)}
        </div>
      </div>
      {byId["ko-3P-1"]&&(
        <div className="wc-br2-third">
          <div className="wc-br2-head">Third-place play-off</div>
          {cardFor("ko-3P-1")}
        </div>
      )}
    </>
  );
}

function KoScheduleView({ko,koResults,liveByFixture,detailIds,onOpenDetail,onSelectTeam,onPreviewKo}:{
  ko:ResolvedKo[];koResults:Record<string,KoResult>;liveByFixture:Record<string,LiveGame>;detailIds:Set<string>;onOpenDetail:(id:string)=>void;
  onSelectTeam:(code:string)=>void;onPreviewKo:(a:string,b:string,fixture:KoFixture)=>void;
}){
  const days=useMemo(()=>{
    const sorted=[...ko].sort((a,b)=>a.fixture.kickoff.localeCompare(b.fixture.kickoff));
    const out:{day:string;key:string;matches:ResolvedKo[]}[]=[];
    for(const m of sorted){
      const d=new Date(m.fixture.kickoff);
      const key=`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const day=d.toLocaleDateString(undefined,{weekday:"long",month:"short",day:"numeric"});
      const last=out[out.length-1];
      if(last&&last.key===key) last.matches.push(m); else out.push({day,key,matches:[m]});
    }
    return out;
  },[ko]);
  const renderSide=(s:KoSide,right:boolean)=>{
    const nameEl=s.team
      ? <button className="wc-sched-name" onClick={(e)=>{e.stopPropagation();onSelectTeam(s.team!.code);}}>{s.team.name}</button>
      : <span className="wc-sched-name wc-sched-tbd">{s.label}</span>;
    const flagEl=s.team?<Flag code={s.team.code} className="wc-sched-flag"/>:null;
    return <span className={`wc-sched-side${right?" wc-sched-side-r":""}`}>{right?<>{flagEl}{nameEl}</>:<>{nameEl}{flagEl}</>}</span>;
  };
  return (
    <div className="wc-schedule">
      {days.map(({day,key,matches})=>(
        <div className="wc-sched-day" key={key}>
          <div className="wc-sched-day-head">{day}</div>
          {matches.map(m=>{
            const f=m.fixture;
            const res=koResults[f.id];
            const lg=liveByFixture[f.id];
            const live=lg&&!res;
            const both=m.home.team&&m.away.team;
            const hg=res?res.homeGoals:lg?.homeGoals, ag=res?res.awayGoals:lg?.awayGoals;
            const tied=res&&res.homeGoals===res.awayGoals;
            const hw=(hg!=null&&ag!=null&&hg>ag)||(!!tied&&(res?.pkHome??0)>(res?.pkAway??0));
            const aw=(hg!=null&&ag!=null&&ag>hg)||(!!tied&&(res?.pkAway??0)>(res?.pkHome??0));
            const detailable=detailIds.has(f.id)||(!!live&&!!lg?.eventId);
            const preview=both&&!res&&!live?()=>onPreviewKo(m.home.team!.code,m.away.team!.code,f):undefined;
            const rowAction=detailable?()=>onOpenDetail(f.id):preview;
            return (
              <div className={`wc-sched-row${rowAction?" wc-sched-row-link":""}${live?" wc-sched-row-live":""}`} key={f.id}
                onClick={rowAction} role={rowAction?"button":undefined} tabIndex={rowAction?0:undefined}
                onKeyDown={rowAction?(e)=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); rowAction(); } }:undefined}>
                <div className="wc-sched-main">
                  <span className={`${hw?"wc-sched-win":aw?"wc-sched-lose":""}`}>{renderSide(m.home,false)}</span>
                  <span className="wc-sched-mid">
                    {res||live
                      ? <span className={`wc-sched-score${live?" wc-sched-score-live":""}`}>{hg}<span className="wc-sched-dash">–</span>{ag}</span>
                      : <span className="wc-sched-time">{formatKickoff(f.kickoff).time}</span>}
                  </span>
                  <span className={`${aw?"wc-sched-win":hw?"wc-sched-lose":""}`}>{renderSide(m.away,true)}</span>
                </div>
                <div className="wc-sched-sub">
                  {live&&<span className="wc-sched-livetag"><span className="wc-live-dot"/>LIVE {lg!.clock||lg!.status}</span>}
                  <span className="wc-sched-grp">{KO_ROUND_LABEL[f.round]}</span>
                  <span className="wc-sched-venue">{f.venue}, {f.city}</span>
                  {detailable?<span className="wc-sched-chev">Match details ›</span>:preview?<span className="wc-sched-chev">Match preview ›</span>:null}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function KnockoutView({groupResults,koResults,goalsByFixture,liveByFixture,detailIds,onOpenDetail,onSelectTeam,onPreviewKo}:{
  groupResults:Record<string,ScoreResult>;koResults:Record<string,KoResult>;goalsByFixture:Record<string,GoalEvent[]>;
  liveByFixture:Record<string,LiveGame>;detailIds:Set<string>;onOpenDetail:(id:string)=>void;
  onSelectTeam:(code:string)=>void;onPreviewKo:(a:string,b:string,fixture:KoFixture)=>void;
}){
  const [view,setView]=useState<"bracket"|"schedule">("bracket");
  const ko=useMemo(()=>resolveKnockout(groupResults,koResults),[groupResults,koResults]);
  return (
    <>
      <div className="wc-groups-bar">
        <div className="wc-view-switch">
          <button className={`wc-view-btn${view==="bracket"?" wc-view-active":""}`} onClick={()=>setView("bracket")}>Bracket</button>
          <button className={`wc-view-btn${view==="schedule"?" wc-view-active":""}`} onClick={()=>setView("schedule")}>Schedule</button>
        </div>
      </div>
      <div className="wc-bracket-note">
        <Info size={14}/> Real knockout schedule with dates &amp; venues. Round-of-32 matchups are projected from the current group standings; third-place qualifiers and later rounds fill in as results come through.
      </div>
      {view==="bracket"
        ? <KoBracket ko={ko} koResults={koResults} liveByFixture={liveByFixture} goalsByFixture={goalsByFixture}
            detailIds={detailIds} onOpenDetail={onOpenDetail} onSelectTeam={onSelectTeam} onPreviewKo={onPreviewKo}/>
        : <KoScheduleView ko={ko} koResults={koResults} liveByFixture={liveByFixture} detailIds={detailIds}
            onOpenDetail={onOpenDetail} onSelectTeam={onSelectTeam} onPreviewKo={onPreviewKo}/>}
    </>
  );
}




function TeamsView({groupResults,koResults,liveByFixture,liveGoals,qualifiers,confirmedLineups,detailIds,onOpenDetail,onSelectTeam,onSelectGroup,onPreviewKo,onPreviewGroup,onTheme,focusTeam}:{
  groupResults:Record<string,ScoreResult>;koResults:Record<string,KoResult>;liveByFixture:Record<string,LiveGame>;liveGoals:GoalEvent[];
  qualifiers:ReturnType<typeof computeQualifiers>|null;
  confirmedLineups:Record<string,ConfirmedXI>;
  detailIds:Set<string>;onOpenDetail:(id:string)=>void;onSelectTeam:(code:string)=>void;onSelectGroup:(letter:string)=>void;
  onPreviewKo:(a:string,b:string,fixture:KoFixture)=>void;onPreviewGroup:(id:string)=>void;
  onTheme:(code:string|null)=>void;
  focusTeam:{code:string;k:number}|null;
}) {
  const ko=useMemo(()=>resolveKnockout(groupResults,koResults),[groupResults,koResults]);
  const [search,setSearch]=useState("");
  const [confed,setConfed]=useState("all");
  const [group,setGroup]=useState("all");
  const [sort,setSort]=useState("rank");
  const visibleOpenRef=useRef<Record<string,OpenTeamVisibility>>({});
  const [themePick,setThemePick]=useState<string|null>(null);

  // jumping to a specific team (from a match card) clears filters so it's visible
  useEffect(()=>{ if(focusTeam){ setSearch(""); setConfed("all"); setGroup("all"); } },[focusTeam?.k]);

  const updateOpenVisibility=useCallback((code:string,v:OpenTeamVisibility|null)=>{
    if(v&&v.ratio>0) visibleOpenRef.current[code]=v;
    else delete visibleOpenRef.current[code];
    const visible=Object.values(visibleOpenRef.current).filter(x=>x.ratio>=0.08);
    visible.sort((a,b)=>(b.ratio-a.ratio)||(a.center-b.center));
    setThemePick(visible[0]?.code ?? null);
  },[]);

  useEffect(()=>{ onTheme(themePick); },[themePick,onTheme]);
  useEffect(()=>()=>onTheme(null),[onTheme]);

  const shown=useMemo(()=>{
    const q=search.trim().toLowerCase();
    let list=TEAMS.filter(t=>
      (confed==="all"||t.confed===confed)&&
      (group==="all"||t.group===group)&&
      (!q||t.name.toLowerCase().includes(q)||t.code.toLowerCase().includes(q))
    );
    const by:Record<string,(a:Team,b:Team)=>number>={
      rank:(a,b)=>a.fifaRank-b.fifaRank,
      group:(a,b)=>a.group.localeCompare(b.group)||a.fifaRank-b.fifaRank,
      name:(a,b)=>a.name.localeCompare(b.name),
      rating:(a,b)=>b.rating-a.rating,
    };
    return [...list].sort(by[sort]);
  },[search,confed,group,sort]);

  return (
    <div className="wc-teams-list">
      <div className="wc-teams-controls">
        <input className="wc-teams-search" type="search" placeholder="Search teams…"
          value={search} onChange={e=>setSearch(e.target.value)}/>
        <select className="wc-teams-select" value={confed} onChange={e=>setConfed(e.target.value)} aria-label="Confederation">
          <option value="all">All confederations</option>
          {Object.keys(CONFED).map(c=><option key={c} value={c}>{CONFED[c].label}</option>)}
        </select>
        <select className="wc-teams-select" value={group} onChange={e=>setGroup(e.target.value)} aria-label="Group">
          <option value="all">All groups</option>
          {GROUP_LETTERS.map(g=><option key={g} value={g}>Group {g}</option>)}
        </select>
        <select className="wc-teams-select" value={sort} onChange={e=>setSort(e.target.value)} aria-label="Sort by">
          <option value="rank">Sort: FIFA rank</option>
          <option value="group">Sort: group</option>
          <option value="name">Sort: A–Z</option>
          <option value="rating">Sort: rating</option>
        </select>
        <span className="wc-teams-count">{shown.length} / 48</span>
      </div>
      {shown.length===0
        ? <p className="wc-teams-intro">No teams match those filters.</p>
        : shown.map(team=>(
          <TeamProfileCard key={team.code} team={team}
            focusKey={focusTeam?.code===team.code?focusTeam.k:null}
            groupResults={groupResults} liveGoals={liveGoals} qualifiers={qualifiers}
            confirmed={confirmedLineups[team.code]}
            ko={ko} koResults={koResults} liveByFixture={liveByFixture} onPreviewKo={onPreviewKo}
            onPreviewGroup={onPreviewGroup}
            detailIds={detailIds} onOpenDetail={onOpenDetail} onSelectTeam={onSelectTeam} onSelectGroup={onSelectGroup}
            onOpenVisibility={(v)=>updateOpenVisibility(team.code,v)}/>
        ))}
    </div>
  );
}

const surname=(n:string)=>{const p=n.trim().split(" ");return p.length>1?p.slice(1).join(" "):n;};

interface PlayerStat { goals:number; yellow:boolean; red:boolean; }
function PlayerBadges({p,stat}:{p:DetailPlayer;stat?:PlayerStat}){
  if(!stat?.goals && !p.off && !p.on && !stat?.yellow && !stat?.red) return null;
  return (
    <span className="wc-pb-row">
      {stat&&stat.goals>0&&<span className="wc-pb"><BallIcon size={11}/>{stat.goals>1&&<b>{stat.goals}</b>}</span>}
      {stat?.red ? <span className="wc-pb"><CardIcon red/></span> : stat?.yellow && <span className="wc-pb"><CardIcon/></span>}
      {p.off&&<span className="wc-pb wc-pb-off" title="Subbed off"><ArrowDown size={11}/></span>}
      {p.on&&<span className="wc-pb wc-pb-on" title="Subbed on"><ArrowUp size={11}/></span>}
    </span>
  );
}

function DetailPitch({team,stats}:{team:DetailTeam;stats:Record<string,PlayerStat>}){
  const lines=[1,...(team.formation?team.formation.split("-").map(Number):[])];
  const total=lines.reduce((a,b)=>a+b,0);
  // Band by actual position (ESPN's order isn't reliable), then place each row left→right.
  const ordered=[...team.starters].sort((a,b)=>posRank(a.pos)-posRank(b.pos));
  let idx=0;
  const rows = total===team.starters.length
    ? lines.map(size=>{const r=ordered.slice(idx,idx+size).sort((a,b)=>posSide(a.pos)-posSide(b.pos));idx+=size;return r;})
    : [team.starters];
  const numRows=rows.length;
  const benchOn=team.bench.filter(b=>b.on);
  return (
    <div className="wc-detail-pitch-card" style={pitchAccentStyle(team.code)}>
      <div className="wc-detail-pitch-head">
        <span className="wc-detail-pitch-team"><Flag code={team.code} className="wc-flag-sm"/> {team.name}</span>
        <span className="wc-detail-pitch-form">{team.formation||"XI"}</span>
      </div>
      <div className="wc-pitch">
        <div className="wc-pitch-circle"/><div className="wc-pitch-halfway"/>
        {rows.map((row,ri)=>{
          const top=numRows>1?82-(ri/(numRows-1))*72:50;
          return <div className="wc-pitch-row" style={{top:`${top}%`}} key={ri}>
            {row.map((p,i)=>(
              <div className="wc-pitch-player" style={{left:`${((i+1)/(row.length+1))*100}%`}} key={i}>
                <div className={`wc-pitch-dot${p.off?" wc-pitch-dot-subbed":""}`}>{p.jersey||p.pos}</div>
                <div className="wc-pitch-name">{surname(p.name)}</div>
                <PlayerBadges p={p} stat={stats[p.name]}/>
              </div>
            ))}
          </div>;
        })}
      </div>
      {benchOn.length>0&&(
        <div className="wc-detail-subs">
          <span className="wc-detail-subs-label">Subs on</span>
          {benchOn.map((b,i)=>{
            const s=stats[b.name];
            return <span className="wc-sub-on" key={i}>{surname(b.name)}{s&&s.goals>0&&<span className="wc-pb"> <BallIcon size={10}/>{s.goals>1&&<b>{s.goals}</b>}</span>}{i<benchOn.length-1?", ":""}</span>;
          })}
        </div>
      )}
    </div>
  );
}

function TLIcon({type}:{type:TLType}){
  if(type==="goal") return <BallIcon size={13}/>;
  if(type==="yellow") return <CardIcon/>;
  if(type==="red") return <CardIcon red/>;
  return <ArrowLeftRight size={12}/>;
}
function TLItem({ev}:{ev:TimelineEvent}){
  return (
    <span className="wc-tl-item">
      <span className="wc-tl-icon"><TLIcon type={ev.type}/></span>
      <span className="wc-tl-text"><span className="wc-tl-main">{ev.main}</span>{ev.detail&&<span className="wc-tl-detail">{ev.detail}</span>}</span>
    </span>
  );
}

function MatchDetailModal({eventId,fixture,result,live,onClose,onSelectTeam,onSelectGroup}:{
  eventId:string;fixture:MatchInfo;result?:ScoreResult;live?:LiveGame;onClose:()=>void;onSelectTeam:(c:string)=>void;onSelectGroup:(l:string)=>void;
}){
  const [data,setData]=useState<MatchDetail|null>(null);
  const [status,setStatus]=useState<"loading"|"ok"|"error">("loading");
  useEffect(()=>{
    let alive=true; setStatus("loading");
    fetchMatchDetail(eventId)
      .then(d=>{ if(alive){ setData(d); setStatus("ok"); } })
      .catch(()=>{ if(alive) setStatus("error"); });
    return ()=>{ alive=false; };
  },[eventId]);
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{ if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",h); return ()=>window.removeEventListener("keydown",h);
  },[onClose]);

  // per-player goals/cards parsed from the timeline, for the pitch badges
  const stats=useMemo(()=>{
    const m:Record<string,PlayerStat>={};
    for(const ev of data?.events??[]){
      if(ev.main.includes("(OG)")) continue;
      const s=(m[ev.main] ??= {goals:0,yellow:false,red:false});
      if(ev.type==="goal") s.goals++;
      else if(ev.type==="yellow") s.yellow=true;
      else if(ev.type==="red") s.red=true;
    }
    return m;
  },[data]);

  const home=TEAM_BY_CODE[fixture.homeCode], away=TEAM_BY_CODE[fixture.awayCode];
  const kickoff=formatKickoff(fixture.kickoff);
  const showLive=!result&&!!live;
  const hScore=result?result.homeGoals:live?.homeGoals;
  const aScore=result?result.awayGoals:live?.awayGoals;
  const microFacts=useMemo(()=>buildMatchRecapFacts(fixture,result,live,data),[fixture,result,live,data]);
  const microFallback=useMemo(()=>fallbackMatchRecap(fixture,result,live),[fixture,result,live]);
  const microKey=useMemo(()=>`match:${fixture.id}:recap:${digestCacheKey(microFacts)}`,[fixture.id,microFacts]);
  return (
    <div className="wc-modal-overlay" onClick={onClose}>
      <div className="wc-modal" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="wc-modal-close" onClick={onClose} title="Close"><X size={18}/></button>
        <div className="wc-detail-score">
          <button className="wc-detail-team-btn" onClick={()=>onSelectTeam(home.code)}>
            <Flag code={home.code} className="wc-detail-flag"/>{home.name}
          </button>
          <div className="wc-detail-score-mid">
            {showLive&&<span className="wc-detail-live-tag"><span className="wc-live-dot"/>LIVE {live!.clock||live!.status}</span>}
            {(result||showLive)
              ? <span className={`wc-detail-score-num${showLive?" wc-detail-score-num-live":""}`}>{hScore}–{aScore}</span>
              : <span className="wc-match-vs">vs</span>}
            <span className="wc-detail-when">{kickoff.date} · {fixture.venue}, {fixture.city}</span>
          </div>
          <button className="wc-detail-team-btn wc-detail-team-right" onClick={()=>onSelectTeam(away.code)}>
            {away.name}<Flag code={away.code} className="wc-detail-flag"/>
          </button>
        </div>

        {status!=="loading"&&(
          <MicroDigest facts={microFacts} cacheKey={microKey} fallback={microFallback} tone="recap"
            onSelectTeam={onSelectTeam} onSelectGroup={onSelectGroup}/>
        )}

        {status==="loading"&&<div className="wc-detail-loading"><Loader2 className="wc-spin" size={22}/> Loading match detail…</div>}
        {status==="error"&&<div className="wc-detail-loading">Couldn’t load match detail.</div>}
        {status==="ok"&&data&&(
          <>
            {data.home&&data.away&&data.home.starters.length>0&&(
              <div className="wc-detail-pitches">
                <DetailPitch team={data.home} stats={stats}/>
                <DetailPitch team={data.away} stats={stats}/>
              </div>
            )}
            <div className="wc-detail-timeline">
              <div className="wc-detail-tl-head">Match events</div>
              {data.events.length===0
                ? <div className="wc-detail-empty">No timeline events available for this match.</div>
                : data.events.map(ev=>(
                  <div className="wc-tl-row" key={ev.order}>
                    <div className="wc-tl-left">{ev.side==="home"&&<TLItem ev={ev}/>}</div>
                    <div className="wc-tl-min">{ev.minute}</div>
                    <div className="wc-tl-right">{ev.side==="away"&&<TLItem ev={ev}/>}</div>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PreviewPitch({team,profile,confirmed}:{team:Team;profile:TeamProfile;confirmed?:ConfirmedXI}){
  const formation=confirmed?.formation || profile.formation;
  const xi=confirmed?.xi ?? profile.xi;
  return (
    <div className="wc-detail-pitch-card" style={pitchAccentStyle(team.code)}>
      <div className="wc-detail-pitch-head">
        <span className="wc-detail-pitch-team"><Flag code={team.code} className="wc-flag-sm"/> {team.name}</span>
        <span className="wc-detail-pitch-form">{formation}</span>
      </div>
      <div className="wc-preview-meta">
        {COACHES[team.code]&&<span className="wc-preview-coach"><span className="wc-team-chip-k">Coach</span> {COACHES[team.code]}</span>}
        <span className={`wc-lineup-badge${confirmed?" wc-lineup-confirmed":""}`}>{confirmed?"Possible XI":"Predicted XI"}</span>
      </div>
      <PitchDiagram formation={formation} xi={xi}/>
    </div>
  );
}

function MatchPreviewModal({fixture,groupResults,confirmedLineups,onClose,onSelectTeam,onSelectGroup}:{
  fixture:Fixture;groupResults:Record<string,ScoreResult>;confirmedLineups:Record<string,ConfirmedXI>;onClose:()=>void;onSelectTeam:(c:string)=>void;onSelectGroup:(l:string)=>void;
}){
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{ if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",h); return ()=>window.removeEventListener("keydown",h);
  },[onClose]);
  const home=TEAM_BY_CODE[fixture.homeCode], away=TEAM_BY_CODE[fixture.awayCode];
  const kickoff=formatKickoff(fixture.kickoff);
  const standings=computeStandings(fixture.group,groupResults);
  const hp=TEAM_PROFILES[home.code], ap=TEAM_PROFILES[away.code];
  const isMatchup=(c:string)=>c===home.code||c===away.code;
  const microFacts=useMemo(()=>buildGroupPreviewFacts(fixture,groupResults,confirmedLineups),[fixture,groupResults,confirmedLineups]);
  const microFallback=useMemo(()=>fallbackGroupPreview(fixture,groupResults),[fixture,groupResults]);
  const microKey=useMemo(()=>`match:${fixture.id}:preview:${digestCacheKey(microFacts)}`,[fixture.id,microFacts]);
  return (
    <div className="wc-modal-overlay" onClick={onClose}>
      <div className="wc-modal" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="wc-modal-close" onClick={onClose} title="Close"><X size={18}/></button>
        <div className="wc-detail-score">
          <button className="wc-detail-team-btn" onClick={()=>onSelectTeam(home.code)}>
            <Flag code={home.code} className="wc-detail-flag"/>{home.name}
          </button>
          <div className="wc-detail-score-mid">
            <span className="wc-preview-kick">{kickoff.time}</span>
            <span className="wc-detail-when">{kickoff.date} · Group {fixture.group} · MD{fixture.matchday}</span>
            <span className="wc-detail-when">{fixture.venue}, {fixture.city}</span>
          </div>
          <button className="wc-detail-team-btn wc-detail-team-right" onClick={()=>onSelectTeam(away.code)}>
            {away.name}<Flag code={away.code} className="wc-detail-flag"/>
          </button>
        </div>

        <MicroDigest facts={microFacts} cacheKey={microKey} fallback={microFallback} tone="upcoming"
          onSelectTeam={onSelectTeam} onSelectGroup={onSelectGroup}/>

        <div className="wc-preview-section">
          <div className="wc-preview-h">Group {fixture.group} standings</div>
          <table className="wc-standings">
            <thead><tr><th></th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead>
            <tbody>
              {standings.map((t,i)=>(
                <tr key={t.code} className={isMatchup(t.code)?"wc-preview-hl":""}>
                  <td className="wc-pos">{i+1}</td>
                  <td><TeamChip team={t} onSelect={onSelectTeam}/></td>
                  <td>{t.played}</td><td>{t.win}</td><td>{t.draw}</td><td>{t.loss}</td>
                  <td>{fmtGD(t.gd)}</td><td className="wc-pts">{t.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="wc-preview-section">
          <div className="wc-preview-h">Projected line-ups</div>
          <div className="wc-detail-pitches">
            {hp&&<PreviewPitch team={home} profile={hp} confirmed={confirmedLineups[home.code]}/>}
            {ap&&<PreviewPitch team={away} profile={ap} confirmed={confirmedLineups[away.code]}/>}
          </div>
        </div>
      </div>
    </div>
  );
}

// Preview for a projected knockout matchup (e.g. a team's Round-of-32 game on its path).
function KoPreviewModal({matchup,groupResults,confirmedLineups,onClose,onSelectTeam}:{
  matchup:{a:string;b:string;fixture:KoFixture};groupResults:Record<string,ScoreResult>;confirmedLineups:Record<string,ConfirmedXI>;onClose:()=>void;onSelectTeam:(c:string)=>void;
}){
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{ if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",h); return ()=>window.removeEventListener("keydown",h);
  },[onClose]);
  const a=TEAM_BY_CODE[matchup.a], b=TEAM_BY_CODE[matchup.b];
  const f=matchup.fixture;
  const kickoff=formatKickoff(f.kickoff);
  const ap=TEAM_PROFILES[a.code], bp=TEAM_PROFILES[b.code];
  const microFacts=useMemo(()=>buildKoPreviewFacts(matchup,groupResults,confirmedLineups),[matchup,groupResults,confirmedLineups]);
  const microFallback=useMemo(()=>fallbackKoPreview(matchup),[matchup]);
  const microKey=useMemo(()=>`match:${f.id}:preview:${digestCacheKey(microFacts)}`,[f.id,microFacts]);
  return (
    <div className="wc-modal-overlay" onClick={onClose}>
      <div className="wc-modal" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="wc-modal-close" onClick={onClose} title="Close"><X size={18}/></button>
        <div className="wc-detail-score">
          <button className="wc-detail-team-btn" onClick={()=>onSelectTeam(a.code)}>
            <Flag code={a.code} className="wc-detail-flag"/>{a.name}
          </button>
          <div className="wc-detail-score-mid">
            <span className="wc-preview-kick">{KO_ROUND_LABEL[f.round]}</span>
            <span className="wc-detail-when">{kickoff.date} · {kickoff.time}</span>
            <span className="wc-detail-when">{f.venue}, {f.city}</span>
          </div>
          <button className="wc-detail-team-btn wc-detail-team-right" onClick={()=>onSelectTeam(b.code)}>
            {b.name}<Flag code={b.code} className="wc-detail-flag"/>
          </button>
        </div>
        <MicroDigest facts={microFacts} cacheKey={microKey} fallback={microFallback} tone="upcoming"
          onSelectTeam={onSelectTeam}/>
        <div className="wc-preview-section">
          <div className="wc-preview-h">Projected line-ups</div>
          <div className="wc-detail-pitches">
            {ap&&<PreviewPitch team={a} profile={ap} confirmed={confirmedLineups[a.code]}/>}
            {bp&&<PreviewPitch team={b} profile={bp} confirmed={confirmedLineups[b.code]}/>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsView({goals,cards,matchesPlayed,onSelectTeam}:{
  goals:GoalEvent[];cards:CardEvent[];matchesPlayed:number;
  onSelectTeam:(code:string)=>void;
}) {
  const scorers=useMemo(()=>{
    const m=new Map<string,{player:string;team:string;goals:number;pens:number;headers:number}>();
    for(const g of goals){
      if(g.kind==="owngoal")continue;
      const key=g.player+"|"+g.teamCode;
      const e=m.get(key)??{player:g.player,team:g.teamCode,goals:0,pens:0,headers:0};
      e.goals++; if(g.kind==="penalty")e.pens++; if(g.kind==="header")e.headers++;
      m.set(key,e);
    }
    return [...m.values()].sort((a,b)=>b.goals-a.goals||a.player.localeCompare(b.player));
  },[goals]);

  const teamGoals=useMemo(()=>{
    const m=new Map<string,number>();
    for(const g of goals)m.set(g.teamCode,(m.get(g.teamCode)??0)+1);
    return [...m.entries()].map(([code,n])=>({code,n})).sort((a,b)=>b.n-a.n);
  },[goals]);

  const booked=useMemo(()=>{
    const m=new Map<string,{player:string;team:string;y:number;r:number}>();
    for(const c of cards){
      const key=c.player+"|"+c.teamCode;
      const e=m.get(key)??{player:c.player,team:c.teamCode,y:0,r:0};
      if(c.red)e.r++; else e.y++;
      m.set(key,e);
    }
    return [...m.values()].sort((a,b)=>(b.r-a.r)||(b.y-a.y)).slice(0,8);
  },[cards]);

  const kinds=useMemo(()=>{
    const c={header:0,penalty:0,owngoal:0,freekick:0,volley:0};
    for(const g of goals)if(g.kind in c)(c as Record<string,number>)[g.kind]++;
    return c;
  },[goals]);
  const totalGoals=goals.length;
  const reds=cards.filter(c=>c.red).length;
  const maxScorer=scorers[0]?.goals??1;
  const maxTeam=teamGoals[0]?.n??1;

  if(matchesPlayed===0){
    return (
      <div className="wc-stats-empty">
        <BarChart3 size={40} className="wc-stats-empty-icon"/>
        <p>Tournament stats will appear here once matches have been played.</p>
      </div>
    );
  }

  const tiles:[string,string|number][]=[
    ["Goals",totalGoals],
    ["Matches",matchesPlayed],
    ["Goals / match",(totalGoals/matchesPlayed).toFixed(2)],
    ["Headers",kinds.header],
    ["Penalties",kinds.penalty],
    ["Own goals",kinds.owngoal],
    ["Red cards",reds],
  ];

  const teamCell=(code:string)=>{
    const t=TEAM_BY_CODE[code];
    if(!t)return <span>{code}</span>;
    return <button className="wc-stat-team" onClick={()=>onSelectTeam(code)}><Flag code={code} className="wc-chip-flag"/>{t.name}</button>;
  };
  // player-centric row: player name is primary, team is a small secondary label
  const playerCell=(player:string,code:string)=>{
    const t=TEAM_BY_CODE[code];
    return (
      <>
        <button className="wc-stats-flag-btn" onClick={()=>onSelectTeam(code)} title={t?.name}><Flag code={code} className="wc-flag-sm"/></button>
        <span className="wc-stats-who">
          <span className="wc-stats-player">{player}</span>
          <button className="wc-stats-teamsub" onClick={()=>onSelectTeam(code)}>{t?.name??code}</button>
        </span>
      </>
    );
  };

  return (
    <div className="wc-stats">
      <div className="wc-stats-tiles">
        {tiles.map(([label,val])=>(
          <div className="wc-stats-tile" key={label}>
            <span className="wc-stats-tile-num">{val}</span>
            <span className="wc-stats-tile-label">{label}</span>
          </div>
        ))}
      </div>

      <div className="wc-stats-cols">
        <section className="wc-stats-panel">
          <h3 className="wc-stats-h"><Medal size={15}/> Golden Boot</h3>
          <div className="wc-stats-list">
            {scorers.slice(0,15).map((s,i)=>(
              <div className="wc-stats-row" key={i}>
                <span className="wc-stats-rank">{i+1}</span>
                <div className="wc-stats-bar-wrap">
                  <div className="wc-stats-bar-top">
                    {playerCell(s.player,s.team)}
                    <span className="wc-stats-val">{s.goals}</span>
                  </div>
                  <div className="wc-stats-bar"><div className="wc-stats-bar-fill" style={{width:`${(s.goals/maxScorer)*100}%`}}/></div>
                  {(s.pens>0||s.headers>0)&&(
                    <span className="wc-stats-sub">
                      {s.pens>0&&`${s.pens} pen`}{s.pens>0&&s.headers>0&&" · "}{s.headers>0&&`${s.headers} header`}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="wc-stats-panel">
          <h3 className="wc-stats-h"><BallIcon size={14}/> Most goals by team</h3>
          <div className="wc-stats-list">
            {teamGoals.slice(0,12).map((t,i)=>(
              <div className="wc-stats-row" key={t.code}>
                <span className="wc-stats-rank">{i+1}</span>
                <div className="wc-stats-bar-wrap">
                  <div className="wc-stats-bar-top">{teamCell(t.code)}<span className="wc-stats-val">{t.n}</span></div>
                  <div className="wc-stats-bar"><div className="wc-stats-bar-fill" style={{width:`${(t.n/maxTeam)*100}%`}}/></div>
                </div>
              </div>
            ))}
          </div>

          {booked.length>0&&(
            <>
              <h3 className="wc-stats-h" style={{marginTop:"1.4rem"}}><CardIcon/> Most booked</h3>
              <div className="wc-stats-list">
                {booked.map((b,i)=>(
                  <div className="wc-stats-row wc-stats-row-flat" key={i}>
                    <span className="wc-stats-rank">{i+1}</span>
                    <div className="wc-stats-bar-top">
                      {playerCell(b.player,b.team)}
                      <span className="wc-stats-cards">
                        {b.y>0&&<span className="wc-card-y">{b.y}</span>}
                        {b.r>0&&<span className="wc-card-r">{b.r}</span>}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
      <p className="wc-stats-note">Stats reflect the {matchesPlayed} completed tournament match{matchesPlayed===1?"":"es"} loaded from the live feed. Assists aren’t available in the feed, so they’re omitted.</p>
    </div>
  );
}

// A screen-wide burst of soccer balls arcing up from the bottom — fires on a goal.
function GoalBalls(){
  const balls=useMemo(()=>Array.from({length:20},()=>({
    left:Math.random()*100, x:(Math.random()*2-1)*45, h:55+Math.random()*42,
    r:(Math.random()*2-1)*900, dur:1.7+Math.random()*1.2, delay:Math.random()*0.4,
    size:16+Math.random()*24,
  })),[]);
  return (
    <div className="wc-goal-balls" aria-hidden="true">
      {balls.map((b,i)=>(
        <span className="wc-goal-ball" key={i} style={{
          left:`${b.left}vw`, fontSize:`${b.size}px`, animationDuration:`${b.dur}s`, animationDelay:`${b.delay}s`,
          ["--x" as string]:`${b.x}vw`, ["--h" as string]:`${b.h}vh`, ["--r" as string]:`${b.r}deg`,
        } as CSSProperties}>⚽</span>
      ))}
    </div>
  );
}

function LiveBanner({games,onOpen}:{
  games:LiveGame[];onOpen:(fixtureId:string)=>void;
}) {
  // Detect a score change (goal) per live fixture and trigger the celebration.
  const prevRef=useRef<Record<string,number>>({});
  const [celebrate,setCelebrate]=useState<{fixtureId:string;key:number}|null>(null);
  useEffect(()=>{
    const prev=prevRef.current;
    let scored:string|null=null;
    for(const g of games){
      const total=g.homeGoals+g.awayGoals;
      if(prev[g.fixtureId]!=null && total>prev[g.fixtureId]) scored=g.fixtureId; // a goal since last poll
      prev[g.fixtureId]=total;
    }
    for(const k of Object.keys(prev)) if(!games.some(g=>g.fixtureId===k)) delete prev[k]; // forget ended games
    if(scored) setCelebrate({fixtureId:scored,key:Date.now()});
  },[games]);
  useEffect(()=>{
    if(!celebrate) return;
    const t=setTimeout(()=>setCelebrate(null),2600);
    return ()=>clearTimeout(t);
  },[celebrate?.key]);

  if(!games.length) return null;
  return (
    <div className="wc-livebar">
      {celebrate&&<><GoalBalls key={celebrate.key}/><div className="wc-goal-shout" key={`s${celebrate.key}`}>GOOOAAAL!</div></>}
      <span className="wc-livebar-tag"><span className="wc-live-dot"/>Live now</span>
      <div className="wc-livebar-games">
        {games.map(g=>{
          const h=TEAM_BY_CODE[g.homeCode], a=TEAM_BY_CODE[g.awayCode];
          const goal=celebrate?.fixtureId===g.fixtureId;
          return (
            <button className={`wc-livebar-game${goal?" wc-livebar-game-goal":""}`}
              key={g.fixtureId+(goal?`-${celebrate!.key}`:"")} onClick={()=>onOpen(g.fixtureId)}
              title={`${h?.name} vs ${a?.name} — open match detail`}>
              <span className="wc-livebar-clock">{g.clock||g.status}</span>
              <span className="wc-livebar-teams">
                <Flag code={g.homeCode} className="wc-livebar-flag"/>
                {g.homeCode}
                <b className="wc-livebar-score">{g.homeGoals}–{g.awayGoals}</b>
                {g.awayCode}
                <Flag code={g.awayCode} className="wc-livebar-flag"/>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── AI daily digest (Gemini via the Netlify function proxy) ───────────────────
const DIGEST_ENABLED = true;
const DIGEST_ENDPOINT = "/.netlify/functions/digest";
const MICRO_DIGEST_ENDPOINT = "/.netlify/functions/micro-digest";
const FORCE_COOLDOWN_MS = 15 * 60 * 1000; // each browser can manually refresh at most this often
const localDayKey = (d:Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
// The digest only generates while the tournament is on. After the day the final is played,
// it switches to a fixed honorarium card and stops calling the model.
const DIGEST_FINAL_DAY = (()=>{ const fin=KO_FIXTURES.find(f=>f.round==="F"); return fin?localDayKey(new Date(fin.kickoff)):"9999-12-31"; })();

// Compact, factual summary of the tournament's current state for the model to
// narrate from (so it never invents scores).
const longDate=(iso:string|number)=>new Date(iso).toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});

// Builds the plain-text tournament state the model narrates from. Picks the focus
// automatically: today's games if there are any (live, done, or upcoming); otherwise
// the most recent matchday's results plus the next fixtures to come.
function buildDigestFacts(groupResults:Record<string,ScoreResult>, koResults:Record<string,KoResult>, liveGames:LiveGame[]):string {
  const nm=(c:string)=>TEAM_BY_CODE[c]?.name??c;
  const now=Date.now();
  const today=localDayKey(new Date());
  const liveIds=new Set(liveGames.map(g=>g.fixtureId));
  const koById=Object.fromEntries(resolveKnockout(groupResults,koResults).map(m=>[m.fixture.id,m]));
  const allMatches=[...ALL_GROUP_MATCHES,...KO_FIXTURES];
  const ms=(f:Fixture|KoFixture)=>new Date(f.kickoff).getTime();
  const resultFor=(f:Fixture|KoFixture)=>"group" in f ? groupResults[f.id] : koResults[f.id];
  const labelFor=(f:Fixture|KoFixture)=>"group" in f ? `Group ${f.group}` : KO_ROUND_LABEL[f.round];
  const namesFor=(f:Fixture|KoFixture)=>{
    const live=liveGames.find(g=>g.fixtureId===f.id);
    if(live) return [nm(live.homeCode),nm(live.awayCode)];
    if("group" in f) return [nm(f.homeCode),nm(f.awayCode)];
    const r=koResults[f.id];
    if(r) return [nm(r.homeCode),nm(r.awayCode)];
    const k=koById[f.id];
    return [k?.home.team?.name ?? k?.home.label ?? "TBD", k?.away.team?.name ?? k?.away.label ?? "TBD"];
  };
  const byKickoff=allMatches.sort((a,b)=>ms(a)-ms(b));

  const todayFx=byKickoff.filter(f=>localDayKey(new Date(f.kickoff))===today);
  const todayDone=todayFx.filter(f=>resultFor(f)&&!liveIds.has(f.id));
  const todayNext=todayFx.filter(f=>!resultFor(f)&&!liveIds.has(f.id));
  const hasGamesToday=liveGames.length>0||todayFx.length>0;

  const lines:string[]=[];
  lines.push(`Today's date: ${new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"})}`);
  lines.push(`Focus: ${hasGamesToday?"there are matches today — lead with them":"no matches today — recap the most recent results and preview what's next"}.`);

  if(liveGames.length){
    lines.push("LIVE RIGHT NOW:");
    for(const g of liveGames) {
      const group=FIXTURE_BY_ID[g.fixtureId]?.group;
      const ko=KO_FIXTURES.find(f=>f.id===g.fixtureId);
      lines.push(`- ${nm(g.homeCode)} ${g.homeGoals}-${g.awayGoals} ${nm(g.awayCode)} (${g.clock||g.status}, ${group?`Group ${group}`:ko?KO_ROUND_LABEL[ko.round]:"match"})`);
    }
  }

  if(hasGamesToday){
    if(todayDone.length){
      lines.push("TODAY'S COMPLETED RESULTS:");
      for(const f of todayDone){ const r=resultFor(f)!; const [h,a]=namesFor(f); lines.push(`- ${h} ${r.homeGoals}-${r.awayGoals} ${a} (${labelFor(f)})`); }
    }
    if(todayNext.length){
      lines.push("STILL TO COME TODAY:");
      for(const f of todayNext){ const [h,a]=namesFor(f); lines.push(`- ${h} vs ${a} at ${formatKickoff(f.kickoff).time} (${labelFor(f)}, ${f.venue})`); }
    }
  }else{
    // No games today — recap the latest matchday and preview the next one.
    const done=byKickoff.filter(f=>resultFor(f)&&!liveIds.has(f.id));
    if(done.length){
      const lastDay=localDayKey(new Date(done[done.length-1].kickoff));
      const lastDayFx=done.filter(f=>localDayKey(new Date(f.kickoff))===lastDay);
      lines.push(`MOST RECENT RESULTS (${longDate(lastDayFx[lastDayFx.length-1].kickoff)}):`);
      for(const f of lastDayFx){ const r=resultFor(f)!; const [h,a]=namesFor(f); lines.push(`- ${h} ${r.homeGoals}-${r.awayGoals} ${a} (${labelFor(f)})`); }
    }
    const upcoming=byKickoff.filter(f=>!resultFor(f)&&!liveIds.has(f.id)&&ms(f)>=now);
    if(upcoming.length){
      const nextDay=localDayKey(new Date(upcoming[0].kickoff));
      const nextDayFx=upcoming.filter(f=>localDayKey(new Date(f.kickoff))===nextDay);
      lines.push(`NEXT UP (${longDate(upcoming[0].kickoff)}):`);
      for(const f of nextDayFx){ const [h,a]=namesFor(f); lines.push(`- ${h} vs ${a} at ${formatKickoff(f.kickoff).time} (${labelFor(f)}, ${f.venue})`); }
    }
  }

  const standings:string[]=[];
  for(const L of GROUP_LETTERS){
    const s=computeStandings(L,groupResults);
    if(!s[0]||s[0].played===0) continue;
    standings.push(`- Group ${L}: 1) ${s[0].name} ${s[0].pts}pts (${s[0].win}-${s[0].draw}-${s[0].loss}), 2) ${s[1].name} ${s[1].pts}pts; bottom: ${s[3].name} ${s[3].pts}pts`);
  }
  if(standings.length){ lines.push("CURRENT GROUP STANDINGS:"); lines.push(...standings); }
  return lines.join("\n");
}

// Score-based signature of the tournament state. It changes when a goal is scored
// (a live score moves), a match ends (live → final result), a new match kicks off, or
// the day rolls over — and crucially NOT when only the match clock ticks. This drives
// both the regeneration trigger and the cache key, so goals and full-time fire a fresh
// digest while routine polls don't.
function digestSignature(groupResults:Record<string,ScoreResult>, koResults:Record<string,KoResult>, liveGames:LiveGame[]):string{
  const live=liveGames.map(g=>`L:${g.fixtureId}:${g.homeGoals}-${g.awayGoals}`).sort();
  const done=Object.keys(groupResults).sort().map(id=>`R:${id}:${groupResults[id].homeGoals}-${groupResults[id].awayGoals}`);
  const ko=Object.keys(koResults).sort().map(id=>`K:${id}:${koResults[id].homeCode}-${koResults[id].awayCode}:${koResults[id].homeGoals}-${koResults[id].awayGoals}:${koResults[id].pkHome??""}-${koResults[id].pkAway??""}`);
  return [localDayKey(new Date()),...live,...done,...ko].join("|");
}
function digestCacheKey(sig:string):string{
  let h=5381; for(let i=0;i<sig.length;i++) h=((h<<5)+h+sig.charCodeAt(i))|0;
  return `wc-digest:${h>>>0}`;
}

// ── Team/match micro-digests ─────────────────────────────────────────────────
// These use compact ESPN/local fact packets rather than grounded search. The model
// only adds phrasing; deterministic fallbacks keep the UI useful without the function.
type MicroDigestTone = "team"|"upcoming"|"recap";

function shortRecord(r:StandingRow){ return `${r.win}W-${r.draw}D-${r.loss}L, ${r.pts} pts, GD ${fmtGD(r.gd)}`; }
function matchLabel(f:Fixture|KoFixture|MatchInfo){
  if("group" in f && f.group) return `Group ${f.group}${"matchday" in f && f.matchday?` MD${f.matchday}`:""}`;
  if("round" in f && f.round) return KO_ROUND_LABEL[f.round] ?? f.round;
  return "Match";
}
function confirmedLine(team:Team, confirmedLineups:Record<string,ConfirmedXI>){
  const c=confirmedLineups[team.code];
  const p=TEAM_PROFILES[team.code];
  const formation=c?.formation || p?.formation;
  if(!formation) return `${team.name}: lineup not available`;
  return `${team.name}: ${c?"possible ESPN XI":"predicted XI"} in ${formation}`;
}
function teamFixtureLine(team:Team, f:Fixture, groupResults:Record<string,ScoreResult>, liveByFixture:Record<string,LiveGame>){
  const oppCode=f.homeCode===team.code?f.awayCode:f.homeCode;
  const opp=TEAM_BY_CODE[oppCode];
  const isHome=f.homeCode===team.code;
  const r=groupResults[f.id], live=liveByFixture[f.id];
  if(r){
    const tg=isHome?r.homeGoals:r.awayGoals, og=isHome?r.awayGoals:r.homeGoals;
    return `MD${f.matchday}: ${tg>og?"beat":tg<og?"lost to":"drew with"} ${opp.name} ${tg}-${og}`;
  }
  if(live){
    const tg=isHome?live.homeGoals:live.awayGoals, og=isHome?live.awayGoals:live.homeGoals;
    return `MD${f.matchday}: live vs ${opp.name}, ${tg}-${og} (${live.clock||live.status})`;
  }
  const k=formatKickoff(f.kickoff);
  return `MD${f.matchday}: vs ${opp.name}, ${k.date} ${k.time}`;
}
function buildTeamMicroFacts(team:Team, groupResults:Record<string,ScoreResult>, liveGoals:GoalEvent[], qualifiers:ReturnType<typeof computeQualifiers>|null, ko:ResolvedKo[], koResults:Record<string,KoResult>, liveByFixture:Record<string,LiveGame>, confirmed?:ConfirmedXI):string{
  const standings=computeStandings(team.group,groupResults);
  const pos=standings.findIndex(t=>t.code===team.code)+1;
  const row=standings[pos-1];
  const groupDone=groupIsComplete(team.group,groupResults);
  let status="group still open";
  if(groupDone){
    if(pos<=2) status="advanced automatically";
    else if(pos===3) status=qualifiers?.bestThirds.some(t=>t.code===team.code)?"advanced as a best third-place team":"eliminated from the group";
    else status="eliminated from the group";
  }
  const fixtures=fixturesForGroup(team.group).filter(f=>f.homeCode===team.code||f.awayCode===team.code);
  const scorers=new Map<string,number>();
  for(const g of liveGoals){ if(g.teamCode===team.code&&g.kind!=="owngoal") scorers.set(g.player,(scorers.get(g.player)??0)+1); }
  const koStep=ko.find(m=>(m.home.team?.code===team.code||m.away.team?.code===team.code)&&!koResults[m.fixture.id]);
  const lines=[
    "TYPE: team micro-digest",
    `Team: ${team.name} (${team.code}), Group ${team.group}, FIFA rank ${team.fifaRank}`,
    row ? `Standing: ${pos} in Group ${team.group}; ${shortRecord(row)}` : "Standing: no table row yet",
    `Status: ${status}`,
    `Group matches: ${fixtures.map(f=>teamFixtureLine(team,f,groupResults,liveByFixture)).join("; ") || "none"}`,
  ];
  if(scorers.size) lines.push(`Scorers: ${[...scorers.entries()].map(([n,c])=>`${n}${c>1?` x${c}`:""}`).join(", ")}`);
  if(confirmed) lines.push(`Latest ESPN XI: ${confirmed.formation}; ${confirmed.xi.slice(0,5).map(p=>p.name).join(", ")}${confirmed.xi.length>5?", ...":""}`);
  if(koStep) lines.push(`Knockout context: next projected match is ${KO_ROUND_LABEL[koStep.fixture.round]} vs ${koStep.home.team?.code===team.code?koStep.away.team?.name??koStep.away.label:koStep.home.team?.name??koStep.home.label}`);
  return lines.join("\n");
}
function fallbackTeamMicro(team:Team, groupResults:Record<string,ScoreResult>, qualifiers:ReturnType<typeof computeQualifiers>|null):string{
  const s=computeStandings(team.group,groupResults), pos=s.findIndex(t=>t.code===team.code)+1, row=s[pos-1];
  if(!row||row.played===0) return `${team.name} have not started their group yet. Their first job is simply to establish position in Group ${team.group}.`;
  const done=groupIsComplete(team.group,groupResults);
  const status=done?(pos<=2?"advanced":pos===3&&qualifiers?.bestThirds.some(t=>t.code===team.code)?"advanced as a best third-place team":"eliminated"):"still alive in the group picture";
  return `${team.name} are ${pos} in Group ${team.group} on ${row.pts} points with a ${shortRecord(row)} record. They are ${status}.`;
}
function teamRecentLines(code:string, groupResults:Record<string,ScoreResult>){
  const team=TEAM_BY_CODE[code];
  return fixturesForGroup(team.group).filter(f=>f.homeCode===code||f.awayCode===code).map(f=>teamFixtureLine(team,f,groupResults,{}));
}
function buildGroupPreviewFacts(fixture:Fixture, groupResults:Record<string,ScoreResult>, confirmedLineups:Record<string,ConfirmedXI>):string{
  const home=TEAM_BY_CODE[fixture.homeCode], away=TEAM_BY_CODE[fixture.awayCode];
  const standings=computeStandings(fixture.group,groupResults);
  const k=formatKickoff(fixture.kickoff);
  return [
    "TYPE: upcoming group-match micro-digest",
    `Match: ${home.name} vs ${away.name}`,
    `Kickoff: ${k.date} ${k.time}; ${fixture.venue}, ${fixture.city}`,
    `Context: Group ${fixture.group}, matchday ${fixture.matchday}`,
    `Table: ${standings.map((t,i)=>`${i+1}) ${t.name} ${t.pts} pts GD ${fmtGD(t.gd)}`).join("; ")}`,
    `Recent ${home.name}: ${teamRecentLines(home.code,groupResults).join("; ")}`,
    `Recent ${away.name}: ${teamRecentLines(away.code,groupResults).join("; ")}`,
    `Lineups/formations: ${confirmedLine(home,confirmedLineups)}; ${confirmedLine(away,confirmedLineups)}`,
  ].join("\n");
}
function fallbackGroupPreview(fixture:Fixture, groupResults:Record<string,ScoreResult>):string{
  const home=TEAM_BY_CODE[fixture.homeCode], away=TEAM_BY_CODE[fixture.awayCode];
  const s=computeStandings(fixture.group,groupResults);
  const hp=s.findIndex(t=>t.code===home.code)+1, ap=s.findIndex(t=>t.code===away.code)+1;
  return `${home.name} and ${away.name} meet in Group ${fixture.group} with ${home.name} ${hp || "unplaced"} and ${away.name} ${ap || "unplaced"} in the table. The stakes are shaped by the group table: top two go through automatically, and third can still matter.`;
}
function buildKoPreviewFacts(matchup:{a:string;b:string;fixture:KoFixture}, groupResults:Record<string,ScoreResult>, confirmedLineups:Record<string,ConfirmedXI>):string{
  const a=TEAM_BY_CODE[matchup.a], b=TEAM_BY_CODE[matchup.b], f=matchup.fixture, k=formatKickoff(f.kickoff);
  const rowA=computeStandings(a.group,groupResults).find(t=>t.code===a.code);
  const rowB=computeStandings(b.group,groupResults).find(t=>t.code===b.code);
  return [
    "TYPE: upcoming knockout-match micro-digest",
    `Match: ${a.name} vs ${b.name}`,
    `Round: ${KO_ROUND_LABEL[f.round]}; kickoff ${k.date} ${k.time}; ${f.venue}, ${f.city}`,
    `Group form: ${a.name} ${rowA?shortRecord(rowA):"no group record"}; ${b.name} ${rowB?shortRecord(rowB):"no group record"}`,
    `Lineups/formations: ${confirmedLine(a,confirmedLineups)}; ${confirmedLine(b,confirmedLineups)}`,
    "Stakes: knockout match; loser exits unless this is the third-place match",
  ].join("\n");
}
function fallbackKoPreview(matchup:{a:string;b:string;fixture:KoFixture}):string{
  const a=TEAM_BY_CODE[matchup.a], b=TEAM_BY_CODE[matchup.b], f=matchup.fixture;
  return `${a.name} and ${b.name} meet in the ${KO_ROUND_LABEL[f.round]}. It is a knockout-stage matchup, so the margin for drift is basically gone.`;
}
function buildMatchRecapFacts(fixture:MatchInfo, result:ScoreResult|undefined, live:LiveGame|undefined, data:MatchDetail|null):string{
  const home=TEAM_BY_CODE[fixture.homeCode], away=TEAM_BY_CODE[fixture.awayCode];
  const score=result?`${result.homeGoals}-${result.awayGoals}`:live?`${live.homeGoals}-${live.awayGoals}`:"score unavailable";
  const events=(data?.events??[]).slice(0,10).map(e=>`${e.minute} ${e.type}: ${e.main}${e.detail?` (${e.detail})`:""}`);
  return [
    live?"TYPE: live match micro-digest":"TYPE: past match recap micro-digest",
    `Match: ${home.name} vs ${away.name}`,
    `Score: ${score}${live?` (${live.clock||live.status})`:" final"}`,
    `Context: ${matchLabel(fixture)}; ${fixture.venue}, ${fixture.city}`,
    `Events: ${events.join("; ") || "no major timeline events supplied"}`,
    data?.home&&data?.away ? `Lineups: ${data.home.name} ${data.home.formation}; ${data.away.name} ${data.away.formation}` : "Lineups: not supplied",
  ].join("\n");
}
function fallbackMatchRecap(fixture:MatchInfo, result:ScoreResult|undefined, live:LiveGame|undefined):string{
  const home=TEAM_BY_CODE[fixture.homeCode], away=TEAM_BY_CODE[fixture.awayCode];
  if(live) return `${home.name} and ${away.name} are live at ${live.homeGoals}-${live.awayGoals}. The match detail feed has the latest timeline and lineup context.`;
  if(result) return `${home.name} ${result.homeGoals}-${result.awayGoals} ${away.name} is in the books. The match events below carry the useful detail from ESPN.`;
  return `${home.name} and ${away.name} are listed here with match detail available from ESPN.`;
}

function MicroDigest({facts,cacheKey,fallback,tone="team",onSelectTeam,onSelectGroup}:{
  facts:string;cacheKey:string;fallback:string;tone?:MicroDigestTone;
  onSelectTeam?:(code:string)=>void;onSelectGroup?:(letter:string)=>void;
}) {
  const [text,setText]=useState(fallback);
  const [status,setStatus]=useState<"idle"|"loading"|"ok"|"fallback">("idle");
  useEffect(()=>{
    let alive=true;
    const localKey=`wc-micro:${cacheKey}`;
    try{
      const cached=localStorage.getItem(localKey);
      if(cached){ setText(cached); setStatus("ok"); return; }
    }catch{ /* ignore */ }
    setText(fallback);
    setStatus("loading");
    fetch(MICRO_DIGEST_ENDPOINT,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({facts,cacheKey})})
      .then(async r=>r.ok?await r.json():Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(j=>{
        const t=String(j?.text||"").trim();
        if(!alive||!t) return;
        setText(t); setStatus("ok");
        try{ localStorage.setItem(localKey,t); }catch{ /* ignore */ }
      })
      .catch(()=>{ if(alive){ setText(fallback); setStatus("fallback"); } });
    return ()=>{ alive=false; };
  },[facts,cacheKey,fallback]);
  return (
    <div className={`wc-micro wc-micro-${tone}`}>
      <span className="wc-micro-tag"><Sparkles size={12}/> Context{status==="loading"&&<Loader2 className="wc-spin" size={12}/>}</span>
      <p><MicroTypewriter text={text} onSelectTeam={onSelectTeam} onSelectGroup={onSelectGroup}/></p>
    </div>
  );
}

// Non-AI fallback: a plain-language summary built entirely client-side from the same
// data, so the digest panel always shows something even if the AI backend is down,
// rate-limited, or unconfigured. Reads mechanically, but never blank.
function fallbackDigest(groupResults:Record<string,ScoreResult>, koResults:Record<string,KoResult>, liveGames:LiveGame[]):string{
  const nm=(c:string)=>TEAM_BY_CODE[c]?.name??c;
  const now=Date.now();
  const today=localDayKey(new Date());
  const liveIds=new Set(liveGames.map(g=>g.fixtureId));
  const koById=Object.fromEntries(resolveKnockout(groupResults,koResults).map(m=>[m.fixture.id,m]));
  const allMatches=[...ALL_GROUP_MATCHES,...KO_FIXTURES];
  const ms=(f:Fixture|KoFixture)=>new Date(f.kickoff).getTime();
  const resultFor=(f:Fixture|KoFixture)=>"group" in f ? groupResults[f.id] : koResults[f.id];
  const namesFor=(f:Fixture|KoFixture)=>{
    if("group" in f) return [nm(f.homeCode),nm(f.awayCode)];
    const r=koResults[f.id]; if(r) return [nm(r.homeCode),nm(r.awayCode)];
    const k=koById[f.id]; return [k?.home.team?.name ?? k?.home.label ?? "TBD", k?.away.team?.name ?? k?.away.label ?? "TBD"];
  };
  const byKickoff=allMatches.sort((a,b)=>ms(a)-ms(b));
  const res=(f:Fixture|KoFixture)=>{const r=resultFor(f)!; const [h,a]=namesFor(f); return `${h} ${r.homeGoals}–${r.awayGoals} ${a}`;};
  const fix=(f:Fixture|KoFixture)=>{const [h,a]=namesFor(f); return `${h} v ${a} (${formatKickoff(f.kickoff).time})`;};
  const out:string[]=[];
  if(liveGames.length) out.push(`Live now: ${liveGames.map(g=>`${nm(g.homeCode)} ${g.homeGoals}–${g.awayGoals} ${nm(g.awayCode)} (${g.clock||g.status})`).join("; ")}.`);
  const todayFx=byKickoff.filter(f=>localDayKey(new Date(f.kickoff))===today);
  if(liveGames.length||todayFx.length){
    const done=todayFx.filter(f=>resultFor(f)&&!liveIds.has(f.id));
    const next=todayFx.filter(f=>!resultFor(f)&&!liveIds.has(f.id));
    if(done.length) out.push(`Today's results: ${done.map(res).join("; ")}.`);
    if(next.length) out.push(`Still to come today: ${next.map(fix).join("; ")}.`);
  }else{
    const done=byKickoff.filter(f=>resultFor(f)&&!liveIds.has(f.id));
    if(done.length){ const last=localDayKey(new Date(done[done.length-1].kickoff)); out.push(`Most recent results (${longDate(done[done.length-1].kickoff)}): ${done.filter(f=>localDayKey(new Date(f.kickoff))===last).map(res).join("; ")}.`); }
    const up=byKickoff.filter(f=>!resultFor(f)&&!liveIds.has(f.id)&&ms(f)>=now);
    if(up.length){ const nd=localDayKey(new Date(up[0].kickoff)); out.push(`Next up (${longDate(up[0].kickoff)}): ${up.filter(f=>localDayKey(new Date(f.kickoff))===nd).map(fix).join("; ")}.`); }
  }
  return out.join(" ");
}

// Client-side time-of-day greeting, prepended to the digest so it always reflects the
// viewer's local time (the AI body is written greeting-free).
function timeGreeting():string{
  const h=new Date().getHours();
  if(h>=5&&h<12) return "Good morning";
  if(h>=12&&h<17) return "Good afternoon";
  return "Good evening";
}

// ── Digest linkification ──────────────────────────────────────────────────────
// Turn team names and "Group X" mentions in the digest prose into clickable links.
const DIGEST_TEAM_BY_NAME:Record<string,string>=Object.fromEntries(TEAMS.map(t=>[t.name.toLowerCase(),t.code]));
const DIGEST_LINK_RE=(()=>{
  // Longest names first so "South Korea" wins over "Korea" at the same position.
  const names=[...TEAMS].map(t=>t.name).sort((a,b)=>b.length-a.length)
    .map(n=>n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));
  return new RegExp(`(?<![\\p{L}])(?:Group [A-L]|${names.join("|")})(?![\\p{L}])`,"giu");
})();
type DigestSeg=
  | {t:"text";v:string}
  | {t:"team";v:string;code:string}
  | {t:"group";v:string;code:string}
  | {t:"match";v:string;a:string;b:string};
function tokenizeDigest(text:string):DigestSeg[]{
  const out:DigestSeg[]=[]; let last=0; let m:RegExpExecArray|null;
  DIGEST_LINK_RE.lastIndex=0;
  while((m=DIGEST_LINK_RE.exec(text))){
    if(m.index>last) out.push({t:"text",v:text.slice(last,m.index)});
    const v=m[0];
    if(/^Group /i.test(v)) out.push({t:"group",v,code:v.slice(6).toUpperCase()});
    else{ const code=DIGEST_TEAM_BY_NAME[v.toLowerCase()]; out.push(code?{t:"team",v,code}:{t:"text",v}); }
    last=m.index+v.length;
  }
  if(last<text.length) out.push({t:"text",v:text.slice(last)});
  return out;
}
// "Team A <connective> Team B" → a single match link, when they actually share a fixture.
// Strong connectives between the two names link directly; "and" only links when the prose
// right after the pair carries a match cue ("…face off") — so "Spain and Uruguay in Group H"
// (co-mention) stays two separate team links.
const DIGEST_STRONG_CONN=/^[\s,]*(v|vs\.?|versus|faces?|facing|meets?|hosts?|against|beats?|edged?|defeated?|downs?|past|plays?|playing|takes?\s+on)[\s,]*$/i;
const DIGEST_FOLLOW_CUE=/^[\s,]*(face|faces|facing|meet|meets|play|plays|clash|square\s+off|go\s+head|do\s+battle|lock\s+horns|off\b)/i;
function mergeMatchups(segs:DigestSeg[], hasMatch:(a:string,b:string)=>boolean):DigestSeg[]{
  const out:DigestSeg[]=[];
  for(let i=0;i<segs.length;i++){
    const s=segs[i], mid=segs[i+1], t2=segs[i+2];
    if(s.t==="team"&&mid?.t==="text"&&t2?.t==="team"&&s.code!==t2.code){
      let isMatch=DIGEST_STRONG_CONN.test(mid.v);
      if(!isMatch&&/^[\s,]*and[\s,]*$/i.test(mid.v)){
        const after=segs[i+3]?.t==="text"?(segs[i+3] as {v:string}).v:"";
        isMatch=DIGEST_FOLLOW_CUE.test(after);
      }
      if(isMatch&&hasMatch(s.code,t2.code)){
        out.push({t:"match",v:`${s.v}${mid.v}${t2.v}`,a:s.code,b:t2.code});
        i+=2; continue;
      }
    }
    out.push(s);
  }
  return out;
}
function DigestLinks({text,onSelectTeam,onSelectGroup,onMatch,hasMatch}:{
  text:string;onSelectTeam:(c:string)=>void;onSelectGroup:(l:string)=>void;
  onMatch:(a:string,b:string)=>void;hasMatch:(a:string,b:string)=>boolean;
}){
  const segs=useMemo(()=>mergeMatchups(tokenizeDigest(text),hasMatch),[text,hasMatch]);
  return <>{segs.map((s,i)=>{
    if(s.t==="text") return <span key={i}>{s.v}</span>;
    if(s.t==="match") return <button key={i} className="wc-digest-link wc-digest-matchlink" title="Open match" onClick={()=>onMatch(s.a,s.b)}>{s.v}</button>;
    return <button key={i} className="wc-digest-link" onClick={()=>s.t==="team"?onSelectTeam(s.code):onSelectGroup(s.code)}>{s.v}</button>;
  })}</>;
}

function MicroDigestLinks({text,onSelectTeam,onSelectGroup}:{
  text:string;onSelectTeam?:(c:string)=>void;onSelectGroup?:(l:string)=>void;
}){
  const segs=useMemo(()=>tokenizeDigest(text),[text]);
  return <>{segs.map((s,i)=>{
    if(s.t==="team"&&onSelectTeam) return <button key={i} className="wc-digest-link" onClick={()=>onSelectTeam(s.code)}>{s.v}</button>;
    if(s.t==="group"&&onSelectGroup) return <button key={i} className="wc-digest-link" onClick={()=>onSelectGroup(s.code)}>{s.v}</button>;
    return <span key={i}>{s.v}</span>;
  })}</>;
}

function MicroTypewriter({text,onSelectTeam,onSelectGroup,speed=10}:{
  text:string;onSelectTeam?:(c:string)=>void;onSelectGroup?:(l:string)=>void;speed?:number;
}){
  const [n,setN]=useState(0);
  useEffect(()=>{
    setN(0); if(!text) return;
    let i=0;
    const id=setInterval(()=>{
      i+=3;
      setN(Math.min(i,text.length));
      if(i>=text.length) clearInterval(id);
    },speed);
    return ()=>clearInterval(id);
  },[text,speed]);
  if(n>=text.length) return <MicroDigestLinks text={text} onSelectTeam={onSelectTeam} onSelectGroup={onSelectGroup}/>;
  return <>{text.slice(0,n)}<span className="wc-caret"/></>;
}

// Types out the digest, then swaps to the linkified version once fully revealed.
function Typewriter({text,onSelectTeam,onSelectGroup,onMatch,hasMatch,speed=16}:{
  text:string;onSelectTeam:(c:string)=>void;onSelectGroup:(l:string)=>void;
  onMatch:(a:string,b:string)=>void;hasMatch:(a:string,b:string)=>boolean;speed?:number;
}){
  const [n,setN]=useState(0);
  useEffect(()=>{
    setN(0); if(!text) return;
    let i=0; const id=setInterval(()=>{ i+=2; setN(Math.min(i,text.length)); if(i>=text.length) clearInterval(id); },speed);
    return ()=>clearInterval(id);
  },[text,speed]);
  if(n>=text.length) return <DigestLinks text={text} onSelectTeam={onSelectTeam} onSelectGroup={onSelectGroup} onMatch={onMatch} hasMatch={hasMatch}/>;
  return <>{text.slice(0,n)}<span className="wc-caret"/></>;
}

function DigestPanel({groupResults,koResults,liveGames,matchesPlayed,detailIds,onSelectTeam,onSelectGroup,onOpenPreview,onOpenDetail,onPreviewKo}:{
  groupResults:Record<string,ScoreResult>;koResults:Record<string,KoResult>;liveGames:LiveGame[];matchesPlayed:number;detailIds:Set<string>;
  onSelectTeam:(code:string)=>void;onSelectGroup:(letter:string)=>void;
  onOpenPreview:(id:string)=>void;onOpenDetail:(id:string)=>void;onPreviewKo:(a:string,b:string,fixture:KoFixture)=>void;
}){
  const [text,setText]=useState("");
  const [status,setStatus]=useState<"idle"|"loading"|"error">("idle");
  const [err,setErr]=useState("");
  const facts=useMemo(()=>buildDigestFacts(groupResults,koResults,liveGames),[groupResults,koResults,liveGames]);
  // Match-link wiring: a referenced matchup opens its preview (upcoming) or details (played/live).
  const koMatchups=useMemo(()=>resolveKnockout(groupResults,koResults),[groupResults,koResults]);
  const koMatchOf=useCallback((a:string,b:string)=>koMatchups.find(m=>{const c=[m.home.team?.code,m.away.team?.code];return c.includes(a)&&c.includes(b);})??null,[koMatchups]);
  const hasMatch=useCallback((a:string,b:string)=>!!FIXTURE_BY_PAIR[pairKey(a,b)]||!!koMatchOf(a,b),[koMatchOf]);
  const onMatch=useCallback((a:string,b:string)=>{
    const g=FIXTURE_BY_PAIR[pairKey(a,b)];
    if(g){ (groupResults[g.id]||detailIds.has(g.id))?onOpenDetail(g.id):onOpenPreview(g.id); return; }
    const m=koMatchOf(a,b);
    if(m){ (koResults[m.fixture.id]||detailIds.has(m.fixture.id))?onOpenDetail(m.fixture.id):onPreviewKo(a,b,m.fixture); }
  },[groupResults,koResults,detailIds,koMatchOf,onOpenDetail,onOpenPreview,onPreviewKo]);
  const fallback=useMemo(()=>fallbackDigest(groupResults,koResults,liveGames),[groupResults,koResults,liveGames]);
  // Regenerate on goals / full-time / new kickoffs, not on every clock tick.
  const sig=useMemo(()=>digestSignature(groupResults,koResults,liveGames),[groupResults,koResults,liveGames]);
  const pendingRef=useRef(false); // guard against overlapping requests
  const [gen,setGen]=useState(0); // bumps on every fresh server response → replays the typewriter
  const [note,setNote]=useState(""); // why a manual refresh didn't change (cache/rate-limit)

  const showDigest=(t:string)=>{
    setText(t); setStatus("idle"); setGen(g=>g+1);
    try{ localStorage.setItem("wc-digest-last",t); }catch{ /* ignore */ } // last-good fallback
  };
  const lastGood=()=>{ try{ return localStorage.getItem("wc-digest-last")||""; }catch{ return ""; } };
  // Best available text when the AI call fails: our cached last-good digest, else the
  // locally-built templated summary. Never blank as long as there's data.
  const bestEffort=()=>lastGood()||fallback;

  const generate=async(force:boolean)=>{
    const key=digestCacheKey(sig);
    // Repeat load with unchanged state → serve cache (no API call). A goal, full-time, or
    // new kickoff changes the signature → key differs → regenerate.
    if(!force){
      try{ const c=localStorage.getItem(key); if(c){ setText(JSON.parse(c).text); setStatus("idle"); return; } }catch{ /* ignore */ }
    }
    if(force){
      // Per-browser cooldown so the refresh button can't be hammered (each press is a paid call).
      let last=0; try{ last=Number(localStorage.getItem("wc-digest-forced-at")||0); }catch{ /* ignore */ }
      const wait=FORCE_COOLDOWN_MS-(Date.now()-last);
      if(wait>0){ setNote(`just refreshed — try again in ${Math.ceil(wait/60000)} min`); setGen(g=>g+1); return; }
      try{ localStorage.setItem("wc-digest-forced-at",String(Date.now())); }catch{ /* ignore */ }
    }
    if(pendingRef.current) return; // a request is already in flight
    pendingRef.current=true;
    setStatus("loading"); setErr("");
    try{
      const r=await fetch(DIGEST_ENDPOINT,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({facts,force})});
      let detail=""; if(!r.ok){ try{ const j=await r.clone().json(); detail=[j.error,j.detail].filter(Boolean).join(" · "); }catch{ /* ignore */ } }
      if(!r.ok){
        // Any backend failure (rate limit, missing key, outage) → show the best text we
        // have (cached last-good, else the local templated summary). Never go blank.
        const fb=bestEffort();
        if(force) setNote(`couldn't generate (HTTP ${r.status}${detail?` — ${detail}`:""}) — showing last available`);
        if(fb){ setText(fb); setStatus("idle"); }
        else { setErr(`digest unavailable (HTTP ${r.status})`); setStatus("error"); }
        return;
      }
      const d=await r.json();
      const t=(d.text||"").trim();
      if(!t) throw new Error("empty response from model");
      showDigest(t);
      // On a manual refresh, always report what came back so it's never a silent no-op.
      if(force) setNote(d.cached==="recent"?"refreshed moments ago — showing the latest":d.cached?"served from cache — redeploy the function to force fresh":d.stale?"rate-limited — showing the latest available":"fresh ✓");
      if(!d.stale){ try{ localStorage.setItem(key,JSON.stringify({text:t})); }catch{ /* ignore */ } } // don't cache stale under this state's key
    }catch(e){
      // Network/parse failure → same best-effort fallback.
      const fb=bestEffort();
      if(force) setNote(`couldn't reach the digest service${e instanceof Error?` — ${e.message}`:""}`);
      if(fb){ setText(fb); setStatus("idle"); }
      else { setErr("digest unavailable"); setStatus("error"); }
    }finally{ pendingRef.current=false; }
  };

  // There's always something to say while the tournament is on (today's games, or a recap
  // + what's next). Regenerate whenever the state (a goal / full-time / new day) changes —
  // and only inside the tournament window, so it never fires after the final's day.
  const wrapped=localDayKey(new Date())>DIGEST_FINAL_DAY;
  const hasData=matchesPlayed>0||liveGames.length>0||ALL_GROUP_MATCHES.some(f=>!groupResults[f.id]);
  useEffect(()=>{ if(!wrapped&&hasData) generate(false); },[sig,hasData,wrapped]); // eslint-disable-line

  if(wrapped) return <DigestHonorarium/>; // tournament's over — pay tribute, stop generating
  if(!hasData) return null;
  return (
    <div className="wc-digest">
      <div className="wc-digest-head">
        <span className="wc-digest-tag"><Sparkles size={13}/> Daily digest{note&&<span className="wc-digest-note"> · {note}</span>}</span>
        <button className="wc-digest-refresh" onClick={()=>generate(true)} disabled={status==="loading"} title="Regenerate">
          {status==="loading"?<Loader2 size={13} className="wc-spin"/>:<RotateCcw size={13}/>}
        </button>
      </div>
      <p className="wc-digest-body">
        {text
          ? <Typewriter key={gen} text={`${timeGreeting()} — ${text}`} onSelectTeam={onSelectTeam} onSelectGroup={onSelectGroup} onMatch={onMatch} hasMatch={hasMatch}/>
          : status==="error"
            ? <span className="wc-digest-err">Couldn’t generate the digest — {err}. <button className="wc-digest-retry" onClick={()=>generate(true)}>Retry</button></span>
            : <span className="wc-digest-loading">Generating today’s briefing…</span>}
      </p>
    </div>
  );
}

// Shown once the tournament is over — a fixed tribute, no model calls.
function DigestHonorarium(){
  return (
    <div className="wc-digest wc-digest-honor">
      <div className="wc-digest-head">
        <span className="wc-digest-tag"><Trophy size={13}/> That's full time</span>
      </div>
      <p className="wc-digest-body">
        The 2026 FIFA World Cup is complete — the first 48-team finals, hosted across the
        United States, Mexico, and Canada. Thanks for following every goal, upset, and late
        twist with us. Until 2030.
      </p>
      <div className="wc-honor-stats">
        <div className="wc-honor-stat"><span className="wc-honor-num">48</span><span className="wc-honor-label">teams</span></div>
        <div className="wc-honor-stat"><span className="wc-honor-num">104</span><span className="wc-honor-label">matches</span></div>
        <div className="wc-honor-stat"><span className="wc-honor-num">16</span><span className="wc-honor-label">host cities</span></div>
        <div className="wc-honor-stat"><span className="wc-honor-num">1</span><span className="wc-honor-label">champion</span></div>
      </div>
    </div>
  );
}

function LooseBall({seed,onClose}:{seed:number;onClose:()=>void}) {
  const ballRef=useRef<HTMLButtonElement|null>(null);
  const stateRef=useRef({x:0,y:0,vx:0,vy:0,rot:0,size:52,last:0});
  const closeTimerRef=useRef<number|null>(null);
  const onCloseRef=useRef(onClose);
  const [reduced,setReduced]=useState(false);

  useEffect(()=>{ onCloseRef.current=onClose; },[onClose]);

  const scheduleClose=()=>{
    if(closeTimerRef.current!=null) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current=window.setTimeout(()=>onCloseRef.current(),45000);
  };

  useEffect(()=>{
    const mq=window.matchMedia("(prefers-reduced-motion: reduce)");
    const update=()=>setReduced(mq.matches);
    update();
    mq.addEventListener?.("change",update);
    return ()=>mq.removeEventListener?.("change",update);
  },[]);

  useEffect(()=>{
    if(reduced) return;
    let raf=0;
    const s=stateRef.current;
    s.size=window.innerWidth<520?42:52;
    s.x=Math.min(window.innerWidth-s.size-14,Math.max(14,window.innerWidth*.58));
    s.y=78;
    s.vx=(Math.random()>.5?1:-1)*(3.2+Math.random()*2.2);
    s.vy=-2.5-Math.random()*2;
    s.rot=0;
    s.last=0;

    const step=(t:number)=>{
      if(!s.last) s.last=t;
      const dt=Math.min((t-s.last)/16.67,2.4);
      s.last=t;
      s.vy+=0.34*dt;
      s.x+=s.vx*dt;
      s.y+=s.vy*dt;
      s.vx*=0.998;
      const pad=8;
      const maxX=window.innerWidth-s.size-pad;
      const maxY=window.innerHeight-s.size-pad;
      if(s.x<pad){s.x=pad;s.vx=Math.abs(s.vx)*.86;}
      if(s.x>maxX){s.x=maxX;s.vx=-Math.abs(s.vx)*.86;}
      if(s.y<pad){s.y=pad;s.vy=Math.abs(s.vy)*.72;}
      if(s.y>maxY){s.y=maxY;s.vy=-Math.abs(s.vy)*.78;s.vx*=.94;if(Math.abs(s.vy)<1.1)s.vy=-5.8;}
      s.rot+=s.vx*2.1*dt;
      if(ballRef.current) ballRef.current.style.transform=`translate3d(${s.x}px,${s.y}px,0) rotate(${s.rot}deg)`;
      raf=requestAnimationFrame(step);
    };

    scheduleClose();
    const onKey=(e:KeyboardEvent)=>{ if(e.key==="Escape") onCloseRef.current(); };
    window.addEventListener("keydown",onKey);
    raf=requestAnimationFrame(step);
    return ()=>{
      cancelAnimationFrame(raf);
      if(closeTimerRef.current!=null) window.clearTimeout(closeTimerRef.current);
      window.removeEventListener("keydown",onKey);
    };
  },[seed,reduced]);

  if(reduced) return null;
  const kick=(e:PointerEvent<HTMLButtonElement>)=>{
    e.preventDefault();
    scheduleClose();
    const rect=e.currentTarget.getBoundingClientRect();
    const cx=rect.left+rect.width/2;
    const cy=rect.top+rect.height/2;
    const dx=cx-e.clientX;
    const dy=cy-e.clientY;
    const len=Math.max(1,Math.hypot(dx,dy));
    const s=stateRef.current;
    s.vx+=(dx/len)*8;
    s.vy+=(dy/len)*8-4;
  };

  return (
    <button ref={ballRef} className="wc-loose-ball" onPointerDown={kick} onDoubleClick={onClose} title="Kick" aria-label="Loose ball">
      <span aria-hidden="true" className="wc-loose-ball-emoji">⚽</span>
    </button>
  );
}

export default function App() {
  const [stage,setStage]=useState("groups");
  const [looseBallSeed,setLooseBallSeed]=useState<number|null>(null);
  const titleTapsRef=useRef<number[]>([]);
  // All scores come from the live feed — this is a tracker, not a simulator.
  // Completed results + their ESPN event ids accumulate (and persist) so a played match
  // stays openable for match details even after it drops out of ESPN's scoreboard window.
  const loadStore=<T,>(k:string):T=>{ try{ return JSON.parse(localStorage.getItem(k)||"{}"); }catch{ return {} as T; } };
  const [groupResults,setGroupResults]=useState<Record<string,ScoreResult>>(()=>loadStore("wc26_results"));
  const [koResults,setKoResults]=useState<Record<string,KoResult>>(()=>loadStore("wc26_koresults"));
  const [liveStatus,setLiveStatus]=useState<"loading"|"ok"|"error">("loading");
  const [liveGoals,setLiveGoals]=useState<GoalEvent[]>([]);
  const [liveCards,setLiveCards]=useState<CardEvent[]>([]);
  const [liveMatchesPlayed,setLiveMatchesPlayed]=useState(0);
  const [liveEventIds,setLiveEventIds]=useState<Record<string,string>>(()=>loadStore("wc26_eventids"));
  const [liveGames,setLiveGames]=useState<LiveGame[]>([]);
  const [updatedAt,setUpdatedAt]=useState<number|null>(null);

  // ESPN-confirmed starting XIs, keyed by team code (last published lineup wins).
  // Persisted so a team's last confirmed XI survives reloads between match windows.
  const [confirmedLineups,setConfirmedLineups]=useState<Record<string,ConfirmedXI>>(()=>{
    try{ return JSON.parse(localStorage.getItem("wc26_lineups") || "{}"); }catch{ return {}; }
  });
  const fetchedEventsRef=useRef<Set<string>>(new Set(
    (()=>{ try{ return JSON.parse(localStorage.getItem("wc26_lineup_events") || "[]"); }catch{ return []; } })()
  ));

  // The app's color scheme shifts to the active team's colours, reverting to the
  // default green/gold when you leave the Teams view.
  const [themeCode,setThemeCode]=useState<string|null>(null);
  useEffect(()=>{ if(stage!=="teams") setThemeCode(null); },[stage]);

  // clicking a team in a match card jumps to its Teams page entry
  const [focusTeam,setFocusTeam]=useState<{code:string;k:number}|null>(null);
  const goToTeam=(code:string)=>{ setStage("teams"); setFocusTeam({code,k:Date.now()}); setThemeCode(code); };
  // clicking a group in the digest jumps to the Groups view and scrolls to that group
  const [focusGroup,setFocusGroup]=useState<{letter:string;k:number}|null>(null);
  const goToGroup=(letter:string)=>{ setStage("groups"); setFocusGroup({letter,k:Date.now()}); };

  // detailed match view + pre-match preview (modals)
  const [detailId,setDetailId]=useState<string|null>(null);
  const [previewId,setPreviewId]=useState<string|null>(null);
  const [koPreview,setKoPreview]=useState<{a:string;b:string;fixture:KoFixture}|null>(null);
  const detailIds=useMemo(()=>new Set(Object.keys(liveEventIds)),[liveEventIds]);

  const launchLooseBall=()=>setLooseBallSeed(Date.now());
  const tapTitle=()=>{
    const now=Date.now();
    titleTapsRef.current=[...titleTapsRef.current.filter(t=>now-t<1200),now];
    if(titleTapsRef.current.length>=3){
      titleTapsRef.current=[];
      launchLooseBall();
    }
  };
  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      const target=e.target as HTMLElement|null;
      if(target&&["INPUT","TEXTAREA","SELECT"].includes(target.tagName)) return;
      if(e.key.toLowerCase()==="b"&&!e.metaKey&&!e.ctrlKey&&!e.altKey) launchLooseBall();
    };
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[]);

  // Live tracker: load real data on mount, then keep polling while a match window
  // is active (cheap — no network in between).
  useEffect(()=>{
    let alive=true;
    let timer:ReturnType<typeof setTimeout>;
    const run=async(initial:boolean)=>{
      if(initial||anyMatchWindowActive(Date.now())){
        try{
          const live=await fetchLiveData();
          if(alive){
            const save=(k:string,v:unknown)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch{ /* quota */ } };
            // Merge (don't replace) so completed games + their event ids never get lost
            // when ESPN's response window no longer includes older fixtures.
            setGroupResults(prev=>{ const next={...prev,...live.results}; save("wc26_results",next); return next; });
            setKoResults(prev=>{ const next={...prev,...live.koResults}; save("wc26_koresults",next); return next; });
            setLiveEventIds(prev=>{ const next={...prev,...live.eventIds}; save("wc26_eventids",next); return next; });
            setLiveGoals(live.goals);
            setLiveCards(live.cards);
            setLiveMatchesPlayed(live.matchesPlayed);
            setLiveGames(live.liveGames);
            setUpdatedAt(Date.now());
            setLiveStatus("ok");
          }
        }catch{ if(alive&&initial) setLiveStatus("error"); }
      }
      if(alive) timer=setTimeout(()=>run(false),30000);
    };
    run(true);
    return ()=>{ alive=false; clearTimeout(timer); };
  },[]);

  // Candidate fixtures whose ESPN event has (or may soon have) a published lineup.
  const lineupEvents=useMemo(()=>{
    const m:Record<string,{eventId:string;kickoffMs:number}>={};
    const add=(fid:string,eid:string|undefined)=>{
      const fx=FIXTURE_BY_ID[fid];
      if(fx&&eid) m[fid]={eventId:eid,kickoffMs:new Date(fx.kickoff).getTime()};
    };
    for(const [fid,eid] of Object.entries(liveEventIds)) add(fid,eid);
    for(const g of liveGames) add(g.fixtureId,g.eventId);
    return m;
  },[liveEventIds,liveGames]);

  // Pull published XIs for those events once each, keeping each team's most-recent lineup.
  // Fetched in small parallel batches so a cold load with many completed matches warms up
  // quickly instead of fetching one event at a time.
  useEffect(()=>{
    let alive=true;
    (async()=>{
      const todo=Object.entries(lineupEvents).filter(([,{eventId}])=>!fetchedEventsRef.current.has(eventId));
      const CONCURRENCY=5;
      for(let i=0;i<todo.length&&alive;i+=CONCURRENCY){
        const batch=todo.slice(i,i+CONCURRENCY);
        const results=await Promise.all(batch.map(async([fid,{eventId,kickoffMs}])=>{
          try{ const rosters=await fetchEventLineups(eventId); return rosters.length?{fid,eventId,kickoffMs,rosters}:null; }
          catch{ return null; /* no lineup yet — retry on a later poll */ }
        }));
        if(!alive) break;
        const got=results.filter((r):r is NonNullable<typeof r>=>!!r);
        if(!got.length) continue;
        for(const g of got) fetchedEventsRef.current.add(g.eventId);
        try{ localStorage.setItem("wc26_lineup_events",JSON.stringify([...fetchedEventsRef.current])); }catch{/* quota */}
        setConfirmedLineups(prev=>{
          const next={...prev};
          for(const {fid,kickoffMs,rosters} of got){
            for(const r of rosters){
              const existing=next[r.code];
              if(!existing || kickoffMs>=existing.kickoffMs){
                next[r.code]={code:r.code,formation:r.formation||TEAM_PROFILES[r.code]?.formation||"",xi:detailTeamToXI(r),fixtureId:fid,kickoffMs};
              }
            }
          }
          try{ localStorage.setItem("wc26_lineups",JSON.stringify(next)); }catch{/* quota */}
          return next;
        });
      }
    })();
    return ()=>{ alive=false; };
  },[lineupEvents]);

  const goalsByFixture=useMemo(()=>{
    const m:Record<string,GoalEvent[]>={};
    for(const g of liveGoals){ (m[g.fixtureId] ||= []).push(g); }
    return m;
  },[liveGoals]);

  const liveByFixture=useMemo(()=>{
    const m:Record<string,LiveGame>={};
    for(const g of liveGames){ m[g.fixtureId]=g; }
    return m;
  },[liveGames]);

  const eventIdFor=(fixtureId:string)=>liveEventIds[fixtureId]??liveByFixture[fixtureId]?.eventId??null;
  const detailMatch=detailId?matchInfoFor(detailId,koResults,liveByFixture):null;

  // Group qualifiers (used for best-thirds highlighting and the Teams hub).
  const qualifiers=useMemo(()=>computeQualifiers(groupResults),[groupResults]);

  const totalPlayed=liveMatchesPlayed;
  const totalMatches=ALL_GROUP_MATCHES.length+KO_FIXTURES.length;
  const groupsDone=GROUP_LETTERS.filter(l=>groupIsComplete(l,groupResults)).length;

  return (
    <div className={`wc-app${looseBallSeed!=null?" wc-kick-mode":""}`} style={teamTheme(themeCode)}>
      <style>{CSS}</style>
      {looseBallSeed!=null&&<LooseBall seed={looseBallSeed} onClose={()=>setLooseBallSeed(null)}/>}
      <header className="wc-hero">
        <div className="wc-hero-top">
          <div>
            <div className="wc-hero-kicker">UNITED STATES · MEXICO · CANADA</div>
            <h1 className="wc-hero-title"><button className="wc-hero-title-btn" onClick={tapTitle} type="button">World Cup 2026</button></h1>
            <div className="wc-hero-sub">Live scores, standings, and stats — updating automatically as matches are played.</div>
          </div>
          <div className="wc-hero-actions">
            {liveStatus==="loading"
              ? <span className="wc-updated"><Loader2 size={13} className="wc-spin"/> Loading…</span>
              : liveStatus==="error"
                ? <span className="wc-updated wc-updated-err"><AlertCircle size={13}/> Feed unavailable</span>
                : <span className="wc-updated"><span className="wc-live-dot"/> Updated {updatedAt?formatKickoff(new Date(updatedAt).toISOString()).time:""}</span>}
          </div>
        </div>
        <div className="wc-stat-strip">
          <div className="wc-stat"><span className="wc-stat-label">Matches played</span><span className="wc-stat-value">{totalPlayed} / {totalMatches}</span></div>
          <div className="wc-stat"><span className="wc-stat-label">Groups done</span><span className="wc-stat-value">{groupsDone} / 12</span></div>
          <div className="wc-stat"><span className="wc-stat-label">Format</span><span className="wc-stat-value">Top 2 + best 8 thirds → R32</span></div>
        </div>
      </header>

      {DIGEST_ENABLED&&<DigestPanel groupResults={groupResults} koResults={koResults} liveGames={liveGames} matchesPlayed={liveMatchesPlayed} detailIds={detailIds}
        onSelectTeam={goToTeam} onSelectGroup={goToGroup}
        onOpenPreview={setPreviewId} onOpenDetail={setDetailId} onPreviewKo={(a,b,fixture)=>setKoPreview({a,b,fixture})}/>}

      <LiveBanner games={liveGames} onOpen={setDetailId}/>

      <nav className="wc-nav">
        <div className="wc-nav-flow" role="tablist" aria-label="Tournament stages">
          <button className={`wc-nav-btn${stage==="groups"?" wc-nav-active":""}`} onClick={()=>setStage("groups")}>
            Groups
          </button>
          <button className={`wc-nav-btn${stage==="thirds"?" wc-nav-active":""}`} onClick={()=>setStage("thirds")}>
            Third Place Table
          </button>
          <button className={`wc-nav-btn${stage==="knockout"?" wc-nav-active":""}`} onClick={()=>setStage("knockout")}>
            Knockout
          </button>
        </div>
        <div className="wc-nav-explore">
          <button className={`wc-nav-btn wc-nav-teams${stage==="stats"?" wc-nav-active":""}`} onClick={()=>setStage("stats")}>
            <BarChart3 size={14}/> Stats
          </button>
          <button className={`wc-nav-btn wc-nav-teams${stage==="teams"?" wc-nav-active":""}`} onClick={()=>setStage("teams")}>
            <Users size={14}/> Teams
          </button>
        </div>
      </nav>

      <main className="wc-main">
        {stage==="groups"&&(
          <GroupsView groupResults={groupResults}
            qualifiers={qualifiers} goalsByFixture={goalsByFixture} onSelectTeam={goToTeam}
            detailIds={detailIds} onOpenDetail={setDetailId} onOpenPreview={setPreviewId} liveByFixture={liveByFixture}
            focusGroup={focusGroup}/>
        )}
        {stage==="thirds"&&<ThirdPlaceTableView groupResults={groupResults} liveByFixture={liveByFixture} onSelectTeam={goToTeam}/>}
        {stage==="stats"&&(
          <StatsView goals={liveGoals} cards={liveCards} matchesPlayed={liveMatchesPlayed} onSelectTeam={goToTeam}/>
        )}
        {stage==="teams"&&(
          <TeamsView groupResults={groupResults} koResults={koResults} liveByFixture={liveByFixture}
            liveGoals={liveGoals} qualifiers={qualifiers} confirmedLineups={confirmedLineups}
            detailIds={detailIds} onOpenDetail={setDetailId} onSelectTeam={goToTeam} onSelectGroup={goToGroup}
            onPreviewKo={(a,b,fixture)=>setKoPreview({a,b,fixture})}
            onPreviewGroup={setPreviewId}
            onTheme={setThemeCode} focusTeam={focusTeam}/>
        )}
        {stage==="knockout"&&(
          <KnockoutView groupResults={groupResults} koResults={koResults}
            goalsByFixture={goalsByFixture} liveByFixture={liveByFixture} detailIds={detailIds} onOpenDetail={setDetailId}
            onSelectTeam={goToTeam} onPreviewKo={(a,b,fixture)=>setKoPreview({a,b,fixture})}/>
        )}
      </main>

      {detailId&&eventIdFor(detailId)&&detailMatch&&(
        <MatchDetailModal eventId={eventIdFor(detailId)!} fixture={detailMatch}
          result={groupResults[detailId]??koResults[detailId]} live={liveByFixture[detailId]}
          onClose={()=>setDetailId(null)}
          onSelectTeam={(c)=>{ setDetailId(null); goToTeam(c); }}
          onSelectGroup={(l)=>{ setDetailId(null); goToGroup(l); }}/>
      )}

      {previewId&&FIXTURE_BY_ID[previewId]&&(
        <MatchPreviewModal fixture={FIXTURE_BY_ID[previewId]} groupResults={groupResults} confirmedLineups={confirmedLineups}
          onClose={()=>setPreviewId(null)}
          onSelectTeam={(c)=>{ setPreviewId(null); goToTeam(c); }}
          onSelectGroup={(l)=>{ setPreviewId(null); goToGroup(l); }}/>
      )}

      {koPreview&&(
        <KoPreviewModal matchup={koPreview} groupResults={groupResults} confirmedLineups={confirmedLineups}
          onClose={()=>setKoPreview(null)}
          onSelectTeam={(c)=>{ setKoPreview(null); goToTeam(c); }}/>
      )}

      <footer className="wc-footer">
        <div className="wc-legend">
          {Object.entries(CONFED).map(([key,c])=>(
            <span key={key} className="wc-legend-item">
              <span className="wc-legend-dot" style={{background:c.color}}/> {c.label}
            </span>
          ))}
        </div>
        <details className="wc-about">
          <summary><Info size={13}/> About this tracker</summary>
          <p>A live tracker for the 2026 World Cup. Scores, standings, stats, and lineups update automatically from public match data, refreshing while games are in progress. The knockout bracket is projected from current group standings until the real knockout games begin. The daily digest at the top is AI-generated from the day’s results and fixtures.</p>
        </details>
      </footer>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');

/* Register the themeable colors so they animate when a team theme is applied/removed. */
@property --pitch{syntax:"<color>";inherits:true;initial-value:#14161A;}
@property --pitch-deep{syntax:"<color>";inherits:true;initial-value:#0E1013;}
@property --pitch-card{syntax:"<color>";inherits:true;initial-value:#1D2026;}
@property --pitch-line{syntax:"<color>";inherits:true;initial-value:rgba(244,241,232,.12);}
@property --gold{syntax:"<color>";inherits:true;initial-value:#D7A33D;}
@property --gold-soft{syntax:"<color>";inherits:true;initial-value:rgba(215,163,61,.15);}
@property --chalk{syntax:"<color>";inherits:true;initial-value:#F4F1E8;}
@property --chalk-dim{syntax:"<color>";inherits:true;initial-value:#A8ADB7;}
.wc-app{
  --pitch:#14161A;--pitch-deep:#0E1013;--pitch-card:#1D2026;--pitch-line:rgba(244,241,232,.12);
  --chalk:#F4F1E8;--chalk-dim:#A8ADB7;--gold:#D7A33D;--gold-soft:rgba(215,163,61,.15);
  --green-win:#22543D;--red-loss:rgba(220,53,69,.10);
  font-family:'Space Grotesk',sans-serif;background:var(--pitch);color:var(--chalk);
  min-height:100vh;padding:1.5rem 1rem 3rem;box-sizing:border-box;
  transition:--pitch .7s ease,--pitch-deep .7s ease,--pitch-card .7s ease,--pitch-line .7s ease,--gold .7s ease,--gold-soft .7s ease,--chalk .7s ease,--chalk-dim .7s ease;
}
@media(prefers-reduced-motion:reduce){.wc-app{transition:none;}}
.wc-app *{box-sizing:border-box;}
.wc-app button{font-family:inherit;cursor:pointer;}

/* hero */
.wc-hero{max-width:1200px;margin:0 auto 1.25rem;border-bottom:1px solid var(--pitch-line);padding-bottom:1.25rem;}
.wc-hero-top{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:1rem;}
.wc-hero-kicker{font-size:.68rem;letter-spacing:.14em;color:var(--gold);font-weight:600;}
.wc-hero-title{font-family:'Anton',sans-serif;font-size:clamp(1.8rem,4vw,3rem);margin:.15rem 0;line-height:1;text-transform:uppercase;}
.wc-hero-title-btn{display:block;background:none;border:none;color:var(--chalk);padding:0;text-align:left;letter-spacing:0;font:inherit;text-transform:inherit;line-height:inherit;}
.wc-hero-title-btn:hover{color:var(--chalk);}
.wc-hero-title-btn:focus-visible{outline:2px solid var(--gold);outline-offset:4px;border-radius:4px;}
.wc-hero-sub{color:var(--chalk-dim);font-size:.82rem;}
.wc-btn-ghost-sm{display:inline-flex;align-items:center;gap:.35rem;background:transparent;color:var(--chalk-dim);border:1px solid var(--pitch-line);border-radius:999px;padding:.4rem .85rem;font-size:.78rem;font-weight:600;}
.wc-btn-ghost-sm:hover{color:var(--chalk);border-color:var(--chalk-dim);}
.wc-hero-actions{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;}
.wc-btn-live{display:inline-flex;align-items:center;gap:.4rem;background:rgba(215,163,61,.12);color:var(--gold);border:1px solid rgba(215,163,61,.4);border-radius:999px;padding:.4rem .9rem;font-size:.78rem;font-weight:700;}
.wc-btn-live:hover:not(:disabled){background:rgba(215,163,61,.2);border-color:var(--gold);}
.wc-btn-live:disabled{opacity:.7;cursor:wait;}
.wc-btn-live-on{background:var(--gold);color:var(--pitch-deep);border-color:var(--gold);}
.wc-btn-live-on:hover:not(:disabled){background:var(--gold);color:var(--pitch-deep);}
.wc-spin{animation:wc-spin 1s linear infinite;}
@keyframes wc-spin{to{transform:rotate(360deg);}}
.wc-live-error{display:inline-flex;align-items:center;margin-top:.7rem;color:#f3b0a6;font-size:.76rem;font-weight:600;}
.wc-stat-strip{display:flex;gap:1.5rem;margin-top:.9rem;flex-wrap:wrap;}
.wc-stat{display:flex;flex-direction:column;}
.wc-stat-label{font-size:.64rem;color:var(--chalk-dim);text-transform:uppercase;letter-spacing:.08em;}
.wc-stat-value{font-weight:600;font-size:.88rem;}

/* nav */
.wc-nav{max-width:1200px;margin:0 auto 1.25rem;display:flex;gap:.75rem 1.25rem;flex-wrap:wrap;justify-content:space-between;align-items:center;}
.wc-nav-flow{display:inline-flex;gap:.3rem;flex-wrap:wrap;background:var(--pitch-deep);border:1px solid var(--pitch-line);border-radius:11px;padding:.25rem;}
.wc-nav-flow .wc-nav-btn{background:transparent;border:1px solid transparent;}
.wc-nav-btn{background:var(--pitch-deep);color:var(--chalk-dim);border:1px solid var(--pitch-line);border-radius:8px;padding:.45rem .9rem;font-size:.8rem;font-weight:600;display:inline-flex;align-items:center;gap:.3rem;}
.wc-nav-btn:disabled{opacity:.4;cursor:not-allowed;}
.wc-nav-btn:not(:disabled):not(.wc-nav-active):hover{color:var(--chalk);}
.wc-nav-active{color:var(--pitch-deep);background:var(--gold);border-color:var(--gold);}
.wc-nav-flow .wc-nav-active{background:var(--gold);border-color:var(--gold);}
/* Stats & Teams are reference material, not tournament stages — set apart */
.wc-nav-explore{display:inline-flex;gap:.45rem;flex-wrap:wrap;}
.wc-nav-teams{border-style:dashed;border-color:rgba(244,241,232,.28);}
.wc-nav-teams.wc-nav-active{border-style:solid;}

.wc-main{max-width:1200px;margin:0 auto;}

/* groups grid */
.wc-groups-bar{display:flex;align-items:center;justify-content:space-between;gap:.75rem;flex-wrap:wrap;margin-bottom:1rem;}
.wc-view-switch{display:inline-flex;gap:.2rem;background:var(--pitch-deep);border:1px solid var(--pitch-line);border-radius:10px;padding:.22rem;}
.wc-view-btn{background:transparent;border:none;color:var(--chalk-dim);border-radius:7px;padding:.4rem .9rem;font-size:.78rem;font-weight:700;}
.wc-view-btn:hover{color:var(--chalk);}
.wc-view-active{background:var(--gold);color:var(--pitch-deep);}

/* schedule view */
.wc-schedule{display:flex;flex-direction:column;gap:1.2rem;max-width:680px;margin:0 auto;}
.wc-sched-bar{display:flex;justify-content:flex-end;}
.wc-sched-today{margin-left:.5rem;font-family:'Space Grotesk',sans-serif;font-size:.56rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--pitch-deep);background:var(--gold);border-radius:999px;padding:.1rem .45rem;vertical-align:middle;}
.wc-sched-day{display:flex;flex-direction:column;gap:.5rem;}
.wc-sched-day-head{font-family:'Anton',sans-serif;text-transform:uppercase;letter-spacing:.03em;font-size:.92rem;color:var(--gold);position:sticky;top:0;background:var(--pitch);padding:.3rem 0;z-index:1;}
.wc-sched-row{background:var(--pitch-card);border:1px solid var(--pitch-line);border-radius:11px;padding:.65rem .85rem;display:flex;flex-direction:column;gap:.35rem;}
.wc-sched-row-link{cursor:pointer;}
.wc-sched-row-link:hover{border-color:rgba(215,163,61,.45);}
.wc-sched-main{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:.7rem;}
.wc-sched-side{display:flex;align-items:center;gap:.45rem;justify-content:flex-end;min-width:0;}
.wc-sched-side-r{justify-content:flex-start;}
.wc-sched-flag{width:1.3rem;height:1.3rem;}
.wc-sched-name{background:none;border:none;padding:0;color:var(--chalk);font:inherit;font-size:.85rem;font-weight:600;cursor:pointer;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.wc-sched-side-r .wc-sched-name{text-align:left;}
.wc-sched-name:hover{color:var(--gold);}
.wc-sched-tbd{color:var(--chalk-dim);font-weight:600;cursor:default;}
.wc-sched-win .wc-sched-name{color:var(--gold);font-weight:700;}
.wc-sched-lose .wc-sched-name{opacity:.55;}
.wc-sched-mid{flex-shrink:0;text-align:center;min-width:3rem;}
.wc-sched-score{font-family:'Anton',sans-serif;font-size:1.35rem;color:var(--gold);}
.wc-sched-dash{opacity:.5;margin:0 .15rem;}
.wc-sched-time{font-family:'JetBrains Mono',monospace;font-size:.78rem;font-weight:700;color:var(--chalk-dim);}
.wc-sched-sub{display:flex;flex-wrap:wrap;align-items:center;gap:.3rem .8rem;font-size:.62rem;color:var(--chalk-dim);}
.wc-sched-grp{font-family:'JetBrains Mono',monospace;font-weight:700;color:var(--gold);}
.wc-sched-chev{margin-left:auto;color:var(--gold);font-weight:700;}
.wc-groups-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr));gap:1rem;align-items:start;}

.wc-group-card{background:var(--pitch-card);border:1px solid var(--pitch-line);border-radius:14px;padding:1rem;scroll-margin-top:1rem;}
.wc-group-flash{animation:wc-group-flash 2s ease-out;}
@keyframes wc-group-flash{0%,30%{border-color:var(--gold);box-shadow:0 0 0 3px rgba(215,163,61,.3);}100%{border-color:var(--pitch-line);box-shadow:0 0 0 0 rgba(215,163,61,0);}}
.wc-group-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:.65rem;}
.wc-group-letter{font-family:'Anton',sans-serif;font-size:1.5rem;color:var(--gold);}
.wc-group-pill{display:inline-flex;align-items:center;gap:.25rem;background:var(--pitch-deep);border:1px solid var(--pitch-line);border-radius:999px;padding:.2rem .65rem;font-size:.65rem;font-weight:700;color:var(--chalk-dim);}
.wc-group-pill-done{background:rgba(46,160,67,.16);border-color:rgba(46,160,67,.45);color:#3fbf63;}

.wc-standings{width:100%;border-collapse:collapse;font-size:.74rem;}
.wc-standings .wc-chip,.wc-standings .wc-chip-name,.wc-standings .wc-chip-name-link{white-space:normal;text-align:left;}
.wc-standings th{color:var(--chalk-dim);font-weight:500;text-align:center;padding-bottom:.3rem;}
.wc-standings th:nth-child(2){text-align:left;}
.wc-standings td{padding:.3rem .12rem;text-align:center;border-top:1px solid var(--pitch-line);}
.wc-standings td:nth-child(2){text-align:left;}
.wc-pos{color:var(--chalk-dim);width:1.1rem;}
.wc-pts{font-weight:700;color:var(--gold);}
.wc-row-through{box-shadow:inset 3px 0 0 var(--gold);background:rgba(215,163,61,.1);}
/* Qualification indicators — fixed colours so they stay meaningful under team theming. */
.wc-row-q{box-shadow:inset 3px 0 0 #2ea043;background:rgba(46,160,67,.12);}
.wc-row-third{box-shadow:inset 3px 0 0 #e0a52e;background:rgba(224,165,46,.12);}
.wc-row-out{box-shadow:inset 3px 0 0 #d73a49;background:rgba(215,58,73,.13);}
.wc-row-me{outline:1px solid rgba(244,241,232,.35);outline-offset:-1px;font-weight:700;}
.wc-team-group{margin:.6rem 0 .2rem;}
.wc-team-group-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:.4rem;}
.wc-team-group-title{font-size:.74rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--chalk-dim);}
.wc-team-group-link{background:none;border:none;padding:0;font:inherit;font-size:.76rem;font-weight:700;color:var(--gold);cursor:pointer;}
.wc-team-group-link:hover{text-decoration:underline;}
/* Knockout run inside a team card */
.wc-team-ko{margin:.7rem 0 .2rem;background:var(--pitch-deep);border:1px solid var(--pitch-line);border-radius:12px;padding:.6rem .7rem;}
.wc-team-ko-head{display:flex;align-items:center;justify-content:space-between;gap:.5rem;font-size:.74rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--chalk-dim);margin-bottom:.5rem;}
.wc-team-ko-tag{font-size:.66rem;font-weight:800;letter-spacing:.02em;text-transform:none;border-radius:999px;padding:.12rem .5rem;}
.wc-team-ko-tag-in{background:rgba(46,160,67,.16);color:#3fbf63;}
.wc-team-ko-tag-out{background:rgba(220,53,69,.14);color:#f3a3aa;}
.wc-team-ko-tag-pend{background:rgba(215,163,61,.14);color:var(--gold);}
.wc-team-ko-step{display:grid;grid-template-columns:5.5rem 1fr auto;align-items:center;gap:.5rem;padding:.28rem 0;border-top:1px solid var(--pitch-line);}
.wc-team-ko-step:first-of-type{border-top:none;}
.wc-team-ko-round{font-size:.64rem;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:var(--gold);}
.wc-team-ko-opp{min-width:0;font-size:.86rem;}
.wc-team-ko-opp .wc-linklike{display:inline-flex;align-items:center;gap:.35rem;}
.wc-team-ko-tbd{color:var(--chalk-dim);font-style:italic;font-size:.8rem;}
.wc-team-ko-res{font-family:'JetBrains Mono',monospace;font-size:.74rem;font-weight:700;background:none;border:1px solid var(--pitch-line);border-radius:7px;padding:.18rem .45rem;color:var(--chalk);white-space:nowrap;}
.wc-team-ko-res.win{color:#3fbf63;border-color:rgba(46,160,67,.4);}
.wc-team-ko-res.loss{color:#f3a3aa;border-color:rgba(220,53,69,.35);}
.wc-team-ko-res.live{color:#ff8a8a;border-color:rgba(255,77,77,.45);}
.wc-team-ko-link{cursor:pointer;}
.wc-team-ko-link:hover{background:var(--gold-soft);}
.wc-team-ko-preview{background:none;border:1px solid var(--pitch-line);border-radius:7px;color:var(--gold);font:inherit;font-size:.72rem;font-weight:700;padding:.18rem .5rem;cursor:pointer;white-space:nowrap;}
.wc-team-ko-preview:hover{border-color:var(--gold);}
.wc-team-ko-when{font-size:.72rem;color:var(--chalk-dim);white-space:nowrap;}
.wc-team-next-sub{border-top:1px solid var(--pitch-line);padding-top:.4rem;margin-top:.25rem;font-size:.68rem;color:var(--chalk-dim);}

/* team chip */
/* circular SVG flags (flag-icons squared variant, clipped to a circle) */
.wc-flag{display:inline-block;width:1.1rem;height:1.1rem;border-radius:50%;background-size:cover!important;background-position:center!important;box-shadow:inset 0 0 0 1px rgba(0,0,0,.22);flex-shrink:0;vertical-align:middle;}
.wc-flag-unknown{background:var(--pitch-deep);box-shadow:inset 0 0 0 1px var(--pitch-line);}
.wc-flag-sm{width:1rem;height:1rem;}
.wc-flag-lg{width:2.4rem;height:2.4rem;}

.wc-chip{display:inline-flex;align-items:center;gap:.35rem;white-space:nowrap;}
.wc-chip-tbd{color:var(--chalk-dim);}
.wc-chip-dim{opacity:.55;}
.wc-chip-flag{width:1.1rem;height:1.1rem;}
.wc-chip-code{font-family:'JetBrains Mono',monospace;font-size:.58rem;font-weight:700;color:#fff;border-radius:4px;padding:.12rem .28rem;}
.wc-chip-name{font-size:.75rem;}
.wc-chip-name-link{background:none;border:none;padding:0;color:inherit;font:inherit;font-size:.75rem;cursor:pointer;border-bottom:1px dotted transparent;}
.wc-chip-name-link:hover{color:var(--gold);border-bottom-color:var(--gold);}

.wc-toggle-btn{display:inline-flex;align-items:center;gap:.28rem;background:transparent;border:none;color:var(--chalk-dim);font-size:.7rem;font-weight:600;margin-top:.55rem;padding:0;}
.wc-toggle-btn:hover{color:var(--gold);}

/* match cards */
.wc-group-matches{margin-top:.6rem;border-top:1px solid var(--pitch-line);padding-top:.6rem;display:flex;flex-direction:column;gap:.8rem;}
.wc-matchday{display:flex;flex-direction:column;gap:.4rem;}
.wc-matchday-label{font-size:.62rem;text-transform:uppercase;letter-spacing:.09em;color:var(--chalk-dim);padding-left:.1rem;}

.wc-match-card{
  position:relative;background:var(--pitch-deep);border:1px solid var(--pitch-line);
  border-radius:12px;padding:.65rem .8rem;transition:border-color .15s;
}
.wc-match-card-played{border-color:rgba(215,163,61,.35);}
.wc-match-card-tbd{opacity:.55;}

/* live-now indicators */
.wc-live-dot{display:inline-block;width:.5rem;height:.5rem;border-radius:50%;background:#ff4d4d;box-shadow:0 0 0 0 rgba(255,77,77,.6);animation:wc-pulse 1.6s ease-out infinite;flex-shrink:0;}
@keyframes wc-pulse{0%{box-shadow:0 0 0 0 rgba(255,77,77,.55);}70%{box-shadow:0 0 0 .4rem rgba(255,77,77,0);}100%{box-shadow:0 0 0 0 rgba(255,77,77,0);}}
/* hero "updated" status */
.wc-updated{display:inline-flex;align-items:center;gap:.4rem;font-size:.72rem;font-weight:600;color:var(--chalk-dim);}
.wc-updated-err{color:#f3b0a6;}

/* AI daily digest */
.wc-digest{max-width:1200px;margin:0 auto 1rem;background:linear-gradient(120deg,rgba(215,163,61,.1),rgba(215,163,61,.02));border:1px solid rgba(215,163,61,.3);border-radius:14px;padding:.9rem 1.1rem;}
.wc-digest-honor{background:linear-gradient(120deg,rgba(215,163,61,.18),rgba(215,163,61,.04));border-color:rgba(215,163,61,.5);}
.wc-digest-note{font-size:.6rem;font-weight:600;letter-spacing:.02em;color:var(--chalk-dim);text-transform:none;}
.wc-honor-stats{display:flex;flex-wrap:wrap;gap:1.4rem;margin-top:.7rem;}
.wc-honor-stat{display:flex;flex-direction:column;line-height:1;}
.wc-honor-num{font-family:'Anton',sans-serif;font-size:1.5rem;color:var(--gold);}
.wc-honor-label{font-size:.6rem;letter-spacing:.06em;text-transform:uppercase;color:var(--chalk-dim);margin-top:.2rem;}
.wc-digest-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:.45rem;}
.wc-digest-tag{display:inline-flex;align-items:center;gap:.4rem;font-size:.64rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--gold);}
.wc-digest-refresh{display:inline-flex;background:transparent;border:1px solid var(--pitch-line);border-radius:7px;color:var(--chalk-dim);padding:.25rem;}
.wc-digest-refresh:hover:not(:disabled){color:var(--gold);border-color:rgba(215,163,61,.5);}
.wc-digest-refresh:disabled{opacity:.5;cursor:wait;}
.wc-digest-body{margin:0;font-size:.86rem;line-height:1.65;color:var(--chalk);white-space:pre-wrap;}
.wc-digest-loading{color:var(--chalk-dim);}
.wc-digest-err{color:#f3b0a6;font-size:.78rem;}
.wc-digest-retry{background:none;border:none;color:var(--gold);font:inherit;font-weight:700;text-decoration:underline;cursor:pointer;padding:0;}
.wc-caret{display:inline-block;width:.5rem;height:1em;background:var(--gold);margin-left:1px;vertical-align:text-bottom;animation:wc-blink 1s step-end infinite;}
.wc-digest-link{display:inline;background:none;border:none;padding:0;margin:0;font:inherit;color:var(--gold);font-weight:700;cursor:pointer;border-bottom:1px solid rgba(215,163,61,.35);line-height:inherit;}
.wc-digest-link:hover{border-bottom-color:var(--gold);background:rgba(215,163,61,.1);}
/* Match links (two teams playing each other) — dashed underline to distinguish from a team link. */
.wc-digest-matchlink{border-bottom-style:dashed;}
@keyframes wc-blink{50%{opacity:0;}}

.wc-micro{border:1px solid rgba(215,163,61,.22);background:rgba(215,163,61,.07);border-radius:10px;padding:.65rem .75rem;margin:.75rem 0;color:var(--chalk);}
.wc-micro-tag{display:inline-flex;align-items:center;gap:.32rem;color:var(--gold);font-size:.58rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin-bottom:.25rem;}
.wc-micro-tag .wc-spin{margin-left:.15rem;}
.wc-micro p{margin:0;font-size:.78rem;line-height:1.55;color:var(--chalk-dim);}
.wc-micro-team{background:rgba(244,241,232,.045);border-color:var(--pitch-line);}
.wc-micro-recap{background:rgba(46,160,67,.08);border-color:rgba(46,160,67,.25);}
.wc-micro-upcoming{background:rgba(215,163,61,.07);border-color:rgba(215,163,61,.22);}

/* projected-bracket note */
.wc-bracket-note{display:flex;align-items:flex-start;gap:.5rem;max-width:760px;margin:0 0 1rem;font-size:.74rem;line-height:1.5;color:var(--chalk-dim);background:var(--pitch-card);border:1px solid var(--pitch-line);border-left:3px solid var(--gold);border-radius:8px;padding:.6rem .8rem;}
.wc-bracket-note svg{color:var(--gold);flex-shrink:0;margin-top:.1rem;}

.wc-livebar{position:relative;width:fit-content;max-width:1200px;margin:0 auto 1rem;display:flex;align-items:center;justify-content:center;gap:.7rem;background:linear-gradient(90deg,rgba(255,77,77,.14),rgba(255,77,77,.04));border:1px solid rgba(255,77,77,.4);border-radius:12px;padding:.55rem .8rem;flex-wrap:wrap;}
/* ── Goal celebration ── */
.wc-goal-balls{position:fixed;inset:0;pointer-events:none;z-index:60;overflow:hidden;}
.wc-goal-ball{position:absolute;bottom:-50px;line-height:1;will-change:transform,opacity;animation-name:wc-ball-arc;animation-timing-function:cubic-bezier(.25,.7,.4,1);animation-fill-mode:both;}
@keyframes wc-ball-arc{
  0%{transform:translate(0,0) rotate(0);opacity:0;}
  8%{opacity:1;}
  45%{transform:translate(calc(var(--x)*.5),calc(-1 * var(--h))) rotate(calc(var(--r)*.5));}
  100%{transform:translate(var(--x),22vh) rotate(var(--r));opacity:0;}
}
.wc-loose-ball{
  position:fixed;left:0;top:0;z-index:70;width:52px;height:52px;border-radius:999px;
  display:flex;align-items:center;justify-content:center;padding:0;border:none;
  background:transparent;box-shadow:none;text-shadow:0 10px 22px rgba(0,0,0,.38);
  font-size:42px;line-height:1;
  cursor:grab;touch-action:none;will-change:transform;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;
}
.wc-loose-ball:active{cursor:grabbing;}
.wc-loose-ball-emoji{display:block;pointer-events:none;user-select:none;-webkit-user-select:none;}
@media(max-width:520px){.wc-loose-ball{width:42px;height:42px;font-size:34px;}}
@media(prefers-reduced-motion:reduce){.wc-loose-ball{display:none;}}
/* Ball mode: cursor becomes a running shoe (you're kicking the ball around). */
@media(prefers-reduced-motion:no-preference){
  .wc-kick-mode,.wc-kick-mode *{cursor:url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32"%3E%3Ctext y="26" font-size="26"%3E👟%3C/text%3E%3C/svg%3E') 16 24,auto !important;}
  .wc-kick-mode .wc-loose-ball:active{cursor:url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32"%3E%3Ctext y="26" font-size="26"%3E👟%3C/text%3E%3C/svg%3E') 16 24,auto !important;}
}
.wc-goal-shout{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:3;font-family:'Anton',sans-serif;font-size:clamp(2.2rem,9vw,5rem);color:var(--gold);text-shadow:0 3px 24px rgba(0,0,0,.55);letter-spacing:.04em;white-space:nowrap;pointer-events:none;animation:wc-goal-shout 2.5s ease-out forwards;}
@keyframes wc-goal-shout{
  0%{opacity:0;transform:translate(-50%,-50%) scale(.5) rotate(-4deg);}
  12%{opacity:1;transform:translate(-50%,-50%) scale(1.15) rotate(2deg);}
  26%{transform:translate(-50%,-50%) scale(1) rotate(0);}
  78%{opacity:1;}
  100%{opacity:0;transform:translate(-50%,-50%) scale(1.06);}
}
.wc-livebar-game-goal{animation:wc-card-goal 2.4s ease-out;z-index:2;}
@keyframes wc-card-goal{
  0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(215,163,61,0);border-color:var(--pitch-line);}
  14%{transform:scale(1.2);box-shadow:0 0 26px 5px rgba(215,163,61,.75);border-color:var(--gold);}
  50%{transform:scale(1.08);box-shadow:0 0 16px 2px rgba(215,163,61,.45);border-color:var(--gold);}
}
@media(prefers-reduced-motion:reduce){
  .wc-goal-balls,.wc-goal-shout{display:none;}
  .wc-livebar-game-goal{animation:none;border-color:var(--gold);}
}
.wc-livebar-tag{display:inline-flex;align-items:center;gap:.4rem;font-size:.66rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#ff8a8a;flex-shrink:0;}
.wc-livebar-games{display:flex;gap:.5rem;flex-wrap:wrap;}
.wc-livebar-game{display:inline-flex;align-items:center;gap:.5rem;background:var(--pitch-card);border:1px solid var(--pitch-line);border-radius:999px;padding:.3rem .75rem;color:var(--chalk);font:inherit;font-size:.78rem;font-weight:600;cursor:pointer;}
.wc-livebar-game:hover{border-color:rgba(255,77,77,.5);}
.wc-livebar-clock{font-family:'JetBrains Mono',monospace;font-size:.62rem;font-weight:700;color:#ff8a8a;}
.wc-livebar-teams{display:inline-flex;align-items:center;gap:.35rem;}
.wc-livebar-flag{width:1.05rem;height:1.05rem;}
.wc-livebar-score{font-family:'Anton',sans-serif;font-weight:400;color:var(--gold);margin:0 .1rem;}

.wc-match-card-live{border-color:rgba(255,77,77,.55);animation:wc-liveglow 1.8s ease-in-out infinite;}
@keyframes wc-liveglow{0%,100%{box-shadow:0 0 0 0 rgba(255,77,77,0);}50%{box-shadow:0 0 0 2px rgba(255,77,77,.22);}}
.wc-match-livetag{position:absolute;top:.45rem;right:.7rem;display:inline-flex;align-items:center;gap:.3rem;font-size:.56rem;font-weight:800;letter-spacing:.05em;color:#ff8a8a;z-index:1;}
.wc-match-score-live{color:#ff6b6b;}

/* schedule live row */
.wc-sched-row-live{border-color:rgba(255,77,77,.5);animation:wc-liveglow 1.8s ease-in-out infinite;}
.wc-sched-score-live{color:#ff6b6b;}
.wc-sched-livetag{display:inline-flex;align-items:center;gap:.3rem;font-weight:800;color:#ff8a8a;}

.wc-match-meta{display:flex;flex-direction:column;gap:.05rem;margin-bottom:.5rem;padding-right:1.2rem;}
.wc-match-when{font-size:.62rem;font-weight:700;letter-spacing:.04em;color:var(--gold);text-transform:uppercase;}
.wc-match-where{font-size:.6rem;color:var(--chalk-dim);line-height:1.2;}

.wc-match-clear{
  position:absolute;top:.45rem;right:.45rem;background:transparent;border:none;
  color:var(--chalk-dim);padding:.15rem;display:flex;align-items:center;
  border-radius:4px;
}
.wc-match-clear:hover{color:var(--chalk);}

.wc-match-body{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:.5rem;}

.wc-match-side{display:flex;flex-direction:column;align-items:flex-start;gap:.4rem;}
.wc-match-side-right{align-items:flex-end;}
.wc-match-side-win .wc-match-name{color:var(--gold);font-weight:700;}
.wc-match-side-loss .wc-match-name{opacity:.5;}

.wc-match-flag{width:1.45rem;height:1.45rem;}
.wc-match-name{font-size:.8rem;font-weight:600;line-height:1.1;}
.wc-match-name-tbd{color:var(--chalk-dim);font-weight:400;}
.wc-match-name-link{background:none;border:none;padding:0;color:inherit;font:inherit;font-weight:600;text-align:inherit;cursor:pointer;border-bottom:1px dotted transparent;}
.wc-match-side-right .wc-match-name-link{text-align:right;}
.wc-match-name-link:hover{color:var(--gold);border-bottom-color:var(--gold);}

/* goal scorers under a match */
.wc-match-goals{display:grid;grid-template-columns:1fr 1fr;gap:.4rem 1rem;margin-top:.55rem;padding-top:.5rem;border-top:1px solid var(--pitch-line);}
.wc-match-goals-side{display:flex;flex-direction:column;gap:.15rem;}
.wc-match-goals-right{align-items:flex-end;text-align:right;}
.wc-goal-row{display:inline-flex;align-items:center;gap:.3rem;font-size:.66rem;color:var(--chalk);}
.wc-goal-ball{color:var(--chalk-dim);}

.wc-match-center{display:flex;flex-direction:column;align-items:center;gap:.2rem;flex-shrink:0;}
.wc-match-score{font-family:'Anton',sans-serif;font-size:1.6rem;color:var(--gold);letter-spacing:.02em;line-height:1;}
.wc-match-score-sep{opacity:.5;margin:0 .15rem;}
.wc-match-vs{font-size:.72rem;color:var(--chalk-dim);font-weight:600;letter-spacing:.05em;}
.wc-match-et{font-size:.55rem;text-transform:uppercase;letter-spacing:.08em;color:var(--chalk-dim);}

/* stepper */
.wc-stepper{display:flex;align-items:center;gap:.3rem;}
.wc-step-btn{
  width:2rem;height:2rem;border-radius:50%;display:flex;align-items:center;justify-content:center;
  border:1.5px solid var(--pitch-line);background:var(--pitch-card);color:var(--chalk);
  transition:all .1s;flex-shrink:0;
}
.wc-step-btn:hover:not(:disabled){background:var(--gold);border-color:var(--gold);color:var(--pitch-deep);}
.wc-step-btn:disabled{opacity:.25;cursor:not-allowed;}
.wc-step-minus{border-color:rgba(215,163,61,.3);}
.wc-step-plus{border-color:rgba(215,163,61,.3);background:rgba(215,163,61,.12);color:var(--gold);}
.wc-step-plus:hover:not(:disabled){background:var(--gold);color:var(--pitch-deep);}
.wc-step-value{font-family:'JetBrains Mono',monospace;font-size:1.1rem;font-weight:700;color:var(--gold);min-width:1.4rem;text-align:center;}

/* penalty shootout */
.wc-match-pk{margin-top:.6rem;padding-top:.55rem;border-top:1px solid var(--pitch-line);display:flex;flex-direction:column;align-items:center;gap:.35rem;}
.wc-pk-label{font-size:.62rem;text-transform:uppercase;letter-spacing:.08em;color:var(--chalk-dim);}
.wc-pk-row{display:flex;align-items:center;gap:.5rem;}
.wc-pk-sep{font-size:1rem;color:var(--chalk-dim);}
.wc-pk-winner{font-size:.72rem;color:var(--gold);font-weight:600;}

/* teams */
.wc-teams-list{display:flex;flex-direction:column;gap:.5rem;max-width:820px;margin:0 auto;}
.wc-teams-intro{color:var(--chalk-dim);font-size:.8rem;max-width:640px;margin:0 0 .5rem;}
.wc-team-body-grid{display:grid;grid-template-columns:1fr;gap:1rem;align-items:start;}
@media(min-width:680px){
  .wc-team-body-grid{grid-template-columns:1fr minmax(240px,300px);gap:1.4rem;}
}
.wc-team-pitch-wrap{width:100%;max-width:300px;margin:0 auto;}

/* teams control bar */
.wc-teams-controls{display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;margin-bottom:.4rem;}
.wc-teams-search{flex:1;min-width:140px;background:var(--pitch-card);border:1px solid var(--pitch-line);border-radius:8px;padding:.45rem .7rem;color:var(--chalk);font:inherit;font-size:.8rem;}
.wc-teams-search::placeholder{color:var(--chalk-dim);}
.wc-teams-select{background:var(--pitch-card);border:1px solid var(--pitch-line);border-radius:8px;padding:.45rem .6rem;color:var(--chalk);font:inherit;font-size:.78rem;cursor:pointer;}
.wc-teams-count{font-size:.7rem;color:var(--chalk-dim);font-weight:600;margin-left:auto;}

/* identity chips */
.wc-team-chips{display:flex;flex-wrap:wrap;gap:.4rem;margin:.7rem 0 .3rem;}
.wc-team-chip{display:inline-flex;align-items:center;gap:.3rem;font-size:.72rem;font-weight:600;color:var(--chalk);background:var(--pitch-deep);border:1px solid var(--pitch-line);border-radius:999px;padding:.22rem .6rem;}
.wc-team-chip-k{font-size:.58rem;text-transform:uppercase;letter-spacing:.05em;color:var(--chalk-dim);}

/* team hub (live) */
.wc-hub{margin:.6rem 0 .2rem;padding:.8rem;background:var(--pitch-deep);border:1px solid var(--pitch-line);border-radius:12px;display:flex;flex-direction:column;gap:.7rem;}
.wc-hub-empty{margin:.6rem 0 .2rem;padding:.7rem .8rem;background:var(--pitch-deep);border:1px solid var(--pitch-line);border-radius:12px;color:var(--chalk-dim);font-size:.74rem;}
.wc-hub-line{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem .9rem;}
.wc-hub-pos{font-family:'Anton',sans-serif;font-size:1.05rem;color:var(--gold);}
.wc-hub-pos-sup{font-size:.62rem;vertical-align:super;margin-left:1px;}
.wc-hub-record{font-size:.72rem;color:var(--chalk-dim);}
.wc-hub-status{margin-left:auto;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;border-radius:999px;padding:.15rem .55rem;}
.wc-hub-status-in{color:var(--gold);background:var(--gold-soft);border:1px solid rgba(215,163,61,.4);}
.wc-hub-status-out{color:#f3b0a6;background:var(--red-loss);border:1px solid rgba(220,53,69,.35);}
.wc-hub-status-pend{color:var(--chalk-dim);border:1px solid var(--pitch-line);}
.wc-hub-results{display:flex;flex-direction:column;gap:.35rem;}
.wc-hub-result{display:flex;align-items:center;gap:.6rem;width:100%;text-align:left;background:var(--pitch-card);border:1px solid var(--pitch-line);border-radius:8px;padding:.35rem .55rem;color:var(--chalk);font:inherit;}
.wc-hub-md{font-family:'JetBrains Mono',monospace;font-size:.6rem;font-weight:700;color:var(--chalk-dim);flex-shrink:0;}
.wc-hub-opp{flex:1;min-width:0;display:inline-flex;align-items:center;gap:.35rem;font-size:.78rem;font-weight:600;}
.wc-hub-link{background:none;border:none;padding:0;font:inherit;color:inherit;cursor:pointer;}
.wc-hub-link:hover{color:var(--gold);text-decoration:underline;}
.wc-hub-outcome{font-family:'JetBrains Mono',monospace;font-size:.72rem;font-weight:700;flex-shrink:0;}
.wc-hub-outcome-link{display:inline-flex;align-items:center;gap:.3rem;background:none;border:1px solid var(--pitch-line);border-radius:6px;padding:.12rem .4rem;cursor:pointer;}
.wc-hub-outcome-link:hover{border-color:var(--gold);background:var(--gold-soft);}
.wc-hub-det{color:var(--gold);font-weight:800;}
.wc-hub-result-W .wc-hub-outcome{color:#5fcf8e;}
.wc-hub-result-L .wc-hub-outcome{color:#f3b0a6;}
.wc-hub-result-D .wc-hub-outcome{color:var(--chalk-dim);}
.wc-hub-result-upcoming{opacity:.6;}
.wc-hub-pending{color:var(--chalk-dim);}
.wc-hub-scorers{display:flex;flex-wrap:wrap;align-items:center;gap:.4rem;}
.wc-hub-scorers-label{font-size:.58rem;text-transform:uppercase;letter-spacing:.05em;color:var(--gold);font-weight:700;}
.wc-hub-scorer{font-size:.7rem;color:var(--chalk);background:var(--pitch-card);border:1px solid var(--pitch-line);border-radius:999px;padding:.12rem .5rem;}
.wc-pitch-dot-cap{box-shadow:0 0 0 2px var(--gold);}
.wc-pitch-cap{color:var(--gold);font-weight:700;}
.wc-team-card{background:var(--pitch-card);border:1px solid var(--pitch-line);border-radius:12px;overflow:hidden;}
.wc-team-card-head{width:100%;display:flex;align-items:center;gap:.7rem;padding:.7rem .9rem;background:transparent;border:none;color:var(--chalk);text-align:left;}
.wc-team-card-head:hover{background:var(--gold-soft);}
/* Cards get tall when expanded — a clear minimize control at the bottom, plus a sticky
   collapse affordance so you're never stranded mid-card. */
.wc-team-collapse{position:sticky;bottom:.6rem;display:flex;align-items:center;justify-content:center;gap:.4rem;width:100%;margin-top:1rem;padding:.55rem;border:1px solid var(--pitch-line);border-radius:10px;background:var(--pitch-deep);color:var(--chalk-dim);font:inherit;font-size:.78rem;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25);}
.wc-team-collapse:hover{color:var(--gold);border-color:var(--gold);}
.wc-team-flag-lg{width:1.8rem;height:1.8rem;}
.wc-team-card-title{display:flex;flex-direction:column;flex:1;min-width:0;}
.wc-team-card-name{font-weight:700;font-size:.9rem;}
.wc-team-card-meta{font-size:.68rem;color:var(--chalk-dim);}
.wc-stars{display:inline-flex;gap:1px;color:var(--gold);flex-shrink:0;}
.wc-star-off{color:rgba(215,163,61,.2);}
.wc-team-card-body{padding:0 .9rem 1rem;border-top:1px solid var(--pitch-line);}
.wc-team-narrative{color:var(--chalk);font-size:.82rem;line-height:1.6;margin:.7rem 0;}
.wc-team-formation-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:.6rem;}
.wc-team-formation-label{font-family:'JetBrains Mono',monospace;font-size:.75rem;color:var(--gold);font-weight:700;}
.wc-lineup-badge{font-size:.6rem;text-transform:uppercase;letter-spacing:.06em;color:var(--chalk-dim);border:1px solid var(--pitch-line);border-radius:999px;padding:.18rem .5rem;}
.wc-lineup-confirmed{color:var(--pitch-deep);background:var(--gold);border-color:var(--gold);}

/* pitch */
.wc-pitch{position:relative;width:100%;aspect-ratio:3/4;background:var(--pitch);border:1px solid var(--pitch-line);border-radius:10px;overflow:hidden;}
.wc-pitch-circle{position:absolute;top:50%;left:50%;width:26%;aspect-ratio:1/1;border:1px solid var(--pitch-line);border-radius:50%;transform:translate(-50%,-50%);}
.wc-pitch-halfway{position:absolute;top:50%;left:0;right:0;height:1px;background:var(--pitch-line);}
.wc-pitch-row{position:absolute;left:0;right:0;transform:translateY(-50%);}
.wc-pitch-player{position:absolute;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;width:3.5rem;}
.wc-pitch-dot{width:1.75rem;height:1.75rem;border-radius:50%;background:var(--kit-bg,var(--gold));color:var(--kit-text,var(--pitch-deep));display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:.56rem;font-weight:700;border:2px solid var(--kit-border,var(--chalk));white-space:nowrap;line-height:1;letter-spacing:-.02em;flex-shrink:0;}
.wc-pitch-dot-empty{background:var(--pitch-deep);color:var(--chalk-dim);border-color:var(--pitch-line);}
.wc-pitch-name{font-size:.58rem;color:var(--chalk);text-align:center;margin-top:.18rem;line-height:1.1;}
.wc-pitch-club{font-size:.5rem;color:var(--chalk-dim);text-align:center;line-height:1.1;}

/* third place */
.wc-thirds-view{display:flex;flex-direction:column;gap:1.5rem;}
.wc-thirds-explainer{background:var(--pitch-card);border:1px solid rgba(215,163,61,.4);border-radius:14px;padding:1.2rem 1.3rem;max-width:680px;}
.wc-explainer-header{display:flex;align-items:flex-start;gap:.9rem;margin-bottom:.9rem;}
.wc-explainer-emoji{display:inline-flex;color:var(--gold);line-height:1;flex-shrink:0;}
.wc-explainer-title{font-family:'Anton',sans-serif;font-size:1.15rem;text-transform:uppercase;letter-spacing:.03em;color:var(--gold);}
.wc-explainer-sub{font-size:.72rem;color:var(--chalk-dim);margin-top:.1rem;}
.wc-explainer-body p{font-size:.83rem;line-height:1.65;margin:0 0 .65rem;color:var(--chalk);}
.wc-explainer-body strong{color:var(--gold);font-weight:600;}
.wc-explainer-stats{display:flex;gap:1.2rem;flex-wrap:wrap;margin-top:1rem;padding-top:.9rem;border-top:1px solid var(--pitch-line);}
.wc-explainer-stat{display:flex;flex-direction:column;align-items:center;gap:.05rem;min-width:55px;}
.wc-explainer-stat-num{font-family:'Anton',sans-serif;font-size:2rem;color:var(--gold);line-height:1;}
.wc-explainer-stat-label{font-size:.6rem;text-transform:uppercase;letter-spacing:.06em;color:var(--chalk-dim);text-align:center;}

.wc-thirds-table-wrap{background:var(--pitch-card);border:1px solid var(--pitch-line);border-radius:12px;padding:1rem;overflow-x:auto;}
.wc-thirds-table{min-width:440px;}
.wc-thirds-table-header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:.7rem;font-weight:700;font-size:.88rem;}
.wc-thirds-progress{font-size:.7rem;color:var(--chalk-dim);font-weight:400;}
.wc-thirds-live-tag{color:#ff8a8a;font-weight:800;font-size:.72rem;letter-spacing:.02em;}
.wc-thirds-live-dot{display:inline-flex;align-items:center;margin-left:.4rem;padding:.05rem .3rem;border-radius:.25rem;font-size:.52rem;font-weight:800;letter-spacing:.05em;color:#ff8a8a;background:rgba(255,77,77,.14);vertical-align:middle;animation:wc-pulse 1.6s ease-out infinite;}
.wc-thirds-grp{font-family:'JetBrains Mono',monospace;font-size:.7rem;font-weight:700;color:var(--gold);text-align:center;}
.wc-thirds-table td{vertical-align:middle;}
.wc-thirds-empty{color:var(--chalk-dim);font-size:.82rem;padding:1.5rem 0;text-align:center;}
.wc-thirds-note{font-size:.7rem;color:var(--chalk-dim);margin-top:.7rem;}
.wc-badge-through{display:inline-flex;align-items:center;gap:.2rem;background:var(--gold-soft);color:var(--gold);border:1px solid rgba(215,163,61,.4);border-radius:999px;padding:.12rem .5rem;font-size:.62rem;font-weight:700;white-space:nowrap;}
.wc-badge-out{background:transparent;color:var(--chalk-dim);border:1px solid var(--pitch-line);border-radius:999px;padding:.12rem .5rem;font-size:.62rem;font-weight:600;white-space:nowrap;}

/* knockout */
/* ── Two-sided knockout bracket (compact code cards + elbow connectors) ── */
.wc-br2-wrap{overflow-x:auto;padding-bottom:.4rem;scrollbar-width:none;-ms-overflow-style:none;}
.wc-br2-wrap::-webkit-scrollbar{display:none;}      /* hide the system scrollbar (still scrollable) */
.wc-br2{display:flex;min-width:max-content;margin:0 auto;align-items:stretch;--g:.7rem;--ln:rgba(244,241,232,.22);}
.wc-br2-col{display:flex;flex-direction:column;flex:0 0 auto;width:108px;}
.wc-br2-head{height:1.6rem;display:flex;align-items:center;justify-content:center;font-family:'Anton',sans-serif;letter-spacing:.02em;font-size:.62rem;text-transform:uppercase;color:var(--gold);text-align:center;}
.wc-br2-body{flex:1;display:flex;flex-direction:column;}
.wc-br2-match{flex:1;display:flex;flex-direction:column;justify-content:center;position:relative;padding:.22rem var(--g);min-height:44px;}
/* compact card */
.wc-br2-card{position:relative;z-index:1;display:flex;flex-direction:column;width:100%;text-align:left;background:var(--pitch-card);border:1px solid var(--pitch-line);border-radius:7px;padding:.28rem .4rem;color:var(--chalk);font:inherit;cursor:pointer;overflow:hidden;}
.wc-br2-card:hover{border-color:var(--gold);}
.wc-br2-teams{display:flex;flex-direction:column;gap:.15rem;}
.wc-br2-team{display:flex;align-items:center;gap:.35rem;font-size:.78rem;min-width:0;}
.wc-br2-team.wc-br2-win{color:var(--gold);}
.wc-br2-team.wc-br2-tbd{color:var(--chalk-dim);}
.wc-br2-flag{width:1.05rem;height:1.05rem;flex-shrink:0;}
.wc-br2-flag-x{width:1.05rem;height:1.05rem;border-radius:2px;background:var(--pitch-line);flex-shrink:0;}
.wc-br2-name{flex:1;min-width:0;white-space:nowrap;overflow:hidden;font-weight:700;letter-spacing:.02em;}
.wc-br2-score{font-family:'JetBrains Mono',monospace;font-weight:700;flex-shrink:0;}
.wc-br2-pk{font-size:.6rem;color:var(--chalk-dim);}
.wc-br2-foot{margin-top:.18rem;font-size:.56rem;color:var(--chalk-dim);letter-spacing:.02em;}
.wc-br2-live{display:inline-flex;align-items:center;gap:.25rem;color:#ff8a8a;font-weight:700;}
/* connectors — LEFT side: outgoing right, incoming left */
.wc-br2-l.wc-br2-src .wc-br2-match::after{content:"";position:absolute;right:0;width:var(--g);box-sizing:border-box;border-right:2px solid var(--ln);}
.wc-br2-l.wc-br2-src .wc-br2-match:nth-child(odd)::after{top:50%;height:50%;border-top:2px solid var(--ln);}
.wc-br2-l.wc-br2-src .wc-br2-match:nth-child(even)::after{bottom:50%;height:50%;border-bottom:2px solid var(--ln);}
.wc-br2-l.wc-br2-single .wc-br2-match::after{content:"";position:absolute;right:0;top:50%;width:var(--g);height:2px;background:var(--ln);}
.wc-br2-l.wc-br2-in .wc-br2-match::before{content:"";position:absolute;left:0;top:50%;width:var(--g);height:2px;background:var(--ln);}
/* connectors — RIGHT side: mirrored (outgoing left, incoming right) */
.wc-br2-r.wc-br2-src .wc-br2-match::after{content:"";position:absolute;left:0;width:var(--g);box-sizing:border-box;border-left:2px solid var(--ln);}
.wc-br2-r.wc-br2-src .wc-br2-match:nth-child(odd)::after{top:50%;height:50%;border-top:2px solid var(--ln);}
.wc-br2-r.wc-br2-src .wc-br2-match:nth-child(even)::after{bottom:50%;height:50%;border-bottom:2px solid var(--ln);}
.wc-br2-r.wc-br2-single .wc-br2-match::after{content:"";position:absolute;left:0;top:50%;width:var(--g);height:2px;background:var(--ln);}
.wc-br2-r.wc-br2-in .wc-br2-match::before{content:"";position:absolute;right:0;top:50%;width:var(--g);height:2px;background:var(--ln);}
/* centre Final: incoming from both semifinals */
.wc-br2-final .wc-br2-match::before{content:"";position:absolute;left:0;top:50%;width:var(--g);height:2px;background:var(--ln);}
.wc-br2-final .wc-br2-match::after{content:"";position:absolute;right:0;top:50%;width:var(--g);height:2px;background:var(--ln);}
.wc-br2-c .wc-br2-card{border-color:var(--gold);}
/* third-place play-off, apart from the tree */
.wc-br2-third{margin:1rem auto 0;max-width:200px;display:flex;flex-direction:column;}

/* knockout seed origin (1st · Grp A) */
.wc-match-seed{font-size:.56rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--chalk-dim);}
.wc-match-side-win .wc-match-seed{color:var(--gold);}

/* empty / champion */
.wc-empty-state{text-align:center;padding:3rem 1rem;color:var(--chalk-dim);display:flex;flex-direction:column;align-items:center;gap:.5rem;}
.wc-empty-hint{font-size:.78rem;}
.wc-champion{display:flex;flex-direction:column;align-items:center;text-align:center;padding:3rem 1rem;gap:.55rem;}
.wc-champion-icon{color:var(--gold);}
.wc-champion-label{color:var(--chalk-dim);font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;}
.wc-champion-name{font-family:'Anton',sans-serif;font-size:clamp(2rem,6vw,3.5rem);text-transform:uppercase;color:var(--gold);line-height:1;}
.wc-champion-runnerups{display:flex;gap:1.2rem;color:var(--chalk-dim);font-size:.82rem;margin-bottom:.7rem;flex-wrap:wrap;justify-content:center;}
.wc-champion-path{display:flex;flex-direction:column;gap:.3rem;margin:1rem 0 1.5rem;font-size:.8rem;}
.wc-champion-path-row{background:var(--pitch-card);border-radius:7px;padding:.38rem .75rem;border:1px solid var(--pitch-line);}

/* stats */
.wc-stats-empty{text-align:center;padding:3rem 1rem;color:var(--chalk-dim);display:flex;flex-direction:column;align-items:center;gap:.9rem;}
.wc-stats-empty-icon{color:var(--gold);opacity:.7;}
.wc-stats{display:flex;flex-direction:column;gap:1.5rem;}
.wc-stats-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:.7rem;}
.wc-stats-tile{background:var(--pitch-card);border:1px solid var(--pitch-line);border-radius:12px;padding:.8rem .6rem;display:flex;flex-direction:column;align-items:center;gap:.15rem;}
.wc-stats-tile-num{font-family:'Anton',sans-serif;font-size:1.9rem;color:var(--gold);line-height:1;}
.wc-stats-tile-label{font-size:.6rem;text-transform:uppercase;letter-spacing:.06em;color:var(--chalk-dim);text-align:center;}
.wc-stats-cols{display:grid;grid-template-columns:1fr;gap:1rem;}
@media(min-width:780px){.wc-stats-cols{grid-template-columns:1fr 1fr;}}
.wc-stats-panel{background:var(--pitch-card);border:1px solid var(--pitch-line);border-radius:14px;padding:1.1rem 1.2rem;}
.wc-stats-h{font-family:'Anton',sans-serif;font-size:1.05rem;text-transform:uppercase;letter-spacing:.02em;color:var(--chalk);margin:0 0 .8rem;display:flex;align-items:center;gap:.4rem;}.wc-stats-h svg{color:var(--gold);}
.wc-stats-list{display:flex;flex-direction:column;gap:.6rem;}
.wc-stats-row{display:flex;align-items:flex-start;gap:.6rem;}
.wc-stats-row-flat{align-items:center;}
.wc-stats-rank{font-family:'JetBrains Mono',monospace;font-size:.7rem;font-weight:700;color:var(--chalk-dim);min-width:1.1rem;text-align:right;padding-top:.1rem;}
.wc-stats-bar-wrap{flex:1;display:flex;flex-direction:column;gap:.2rem;min-width:0;}
.wc-stats-bar-top{display:flex;align-items:center;gap:.5rem;}
.wc-stat-team{display:inline-flex;align-items:center;gap:.3rem;background:none;border:none;padding:0;color:var(--chalk);font:inherit;font-size:.78rem;font-weight:600;cursor:pointer;white-space:nowrap;}
.wc-stat-team:hover{color:var(--gold);}
.wc-stats-name{flex:1;font-size:.78rem;color:var(--chalk-dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.wc-stats-flag-btn{background:none;border:none;padding:0;font-size:1.2rem;line-height:1;cursor:pointer;flex-shrink:0;}
.wc-stats-who{display:flex;flex-direction:column;min-width:0;flex:1;}
.wc-stats-player{font-size:.82rem;font-weight:700;color:var(--chalk);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.wc-stats-teamsub{align-self:flex-start;background:none;border:none;padding:0;font-size:.62rem;color:var(--chalk-dim);cursor:pointer;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.wc-stats-teamsub:hover{color:var(--gold);}
.wc-stats-val{font-family:'Anton',sans-serif;font-size:1.05rem;color:var(--gold);margin-left:auto;}
.wc-stats-bar{height:5px;background:var(--pitch-deep);border-radius:99px;overflow:hidden;}
.wc-stats-bar-fill{height:100%;background:var(--gold);border-radius:99px;}
.wc-stats-sub{font-size:.6rem;color:var(--chalk-dim);}
.wc-stats-cards{display:inline-flex;gap:.25rem;margin-left:auto;}
.wc-card-y,.wc-card-r{font-family:'JetBrains Mono',monospace;font-size:.6rem;font-weight:700;border-radius:3px;padding:.05rem .3rem;color:#1a1a1a;}
.wc-card-y{background:#E7C200;}
.wc-card-r{background:#D03A22;color:#fff;}
.wc-stats-note{font-size:.7rem;color:var(--chalk-dim);}

/* match detail modal */
.wc-match-detail-btn{display:block;width:100%;margin-top:.6rem;padding:.4rem;background:transparent;border:1px solid var(--pitch-line);border-radius:8px;color:var(--chalk-dim);font-size:.7rem;font-weight:700;letter-spacing:.03em;}
.wc-match-detail-btn:hover{color:var(--gold);border-color:rgba(215,163,61,.5);}
.wc-modal-overlay{position:fixed;inset:0;background:rgba(6,20,15,.78);backdrop-filter:blur(3px);display:flex;align-items:flex-start;justify-content:center;padding:1.5rem 1rem;z-index:50;overflow-y:auto;}
.wc-modal{position:relative;background:var(--pitch);border:1px solid rgba(215,163,61,.3);border-radius:16px;max-width:760px;width:100%;padding:1.4rem;margin:auto;}
.wc-confirm{background:var(--pitch-card);border:1px solid var(--pitch-line);border-radius:14px;max-width:380px;width:100%;padding:1.3rem;margin:auto;}
.wc-confirm-title{font-family:'Anton',sans-serif;font-size:1.2rem;text-transform:uppercase;letter-spacing:.02em;color:var(--chalk);margin-bottom:.5rem;}
.wc-confirm-body{font-size:.82rem;line-height:1.55;color:var(--chalk-dim);margin:0 0 1.1rem;}
.wc-confirm-actions{display:flex;justify-content:flex-end;gap:.6rem;}
.wc-confirm-danger{display:inline-flex;align-items:center;gap:.35rem;background:#D03A22;color:#fff;border:1px solid #D03A22;border-radius:999px;padding:.4rem .95rem;font-size:.78rem;font-weight:700;}
.wc-confirm-danger:hover{background:#b83019;border-color:#b83019;}
.wc-modal-close{position:absolute;top:.8rem;right:.8rem;background:var(--pitch-card);border:1px solid var(--pitch-line);border-radius:8px;color:var(--chalk-dim);padding:.3rem;display:flex;}
.wc-modal-close:hover{color:var(--chalk);}
.wc-detail-score{display:flex;align-items:center;justify-content:center;gap:1rem;padding:.3rem 2rem 1rem;border-bottom:1px solid var(--pitch-line);}
.wc-detail-team-btn{flex:1;display:flex;align-items:center;gap:.5rem;background:none;border:none;color:var(--chalk);font:inherit;font-size:.95rem;font-weight:700;cursor:pointer;}
.wc-detail-team-right{justify-content:flex-end;text-align:right;}
.wc-detail-team-btn:hover{color:var(--gold);}
.wc-detail-flag{width:1.6rem;height:1.6rem;}
.wc-detail-score-mid{display:flex;flex-direction:column;align-items:center;gap:.15rem;flex-shrink:0;}
.wc-detail-score-num{font-family:'Anton',sans-serif;font-size:2rem;color:var(--gold);line-height:1;}
.wc-detail-when{font-size:.6rem;color:var(--chalk-dim);text-align:center;max-width:180px;}
.wc-detail-loading{display:flex;align-items:center;justify-content:center;gap:.5rem;color:var(--chalk-dim);padding:2.5rem 1rem;font-size:.85rem;}
.wc-detail-pitches{display:grid;grid-template-columns:1fr;gap:1rem;padding:1.1rem 0;}
@media(min-width:620px){.wc-detail-pitches{grid-template-columns:1fr 1fr;}}
.wc-detail-pitch-card{display:flex;flex-direction:column;gap:.5rem;}
.wc-detail-pitch-head{display:flex;justify-content:space-between;align-items:center;gap:.5rem;}
.wc-detail-pitch-team{font-size:.82rem;font-weight:700;}
.wc-detail-pitch-form{font-family:'JetBrains Mono',monospace;font-size:.7rem;font-weight:700;color:var(--gold);}
.wc-detail-pitch-card .wc-pitch{max-width:340px;width:100%;margin:0 auto;}
.wc-pitch-dot-subbed{opacity:.5;}
.wc-pb-row{display:inline-flex;align-items:center;gap:.12rem;margin-top:.1rem;line-height:1;}
.wc-pb{font-size:.62rem;display:inline-flex;align-items:center;}
.wc-cardicon{display:inline-block;width:.5rem;height:.68rem;border-radius:1.5px;background:#E7C200;vertical-align:middle;}
.wc-cardicon-r{background:#D03A22;}
.wc-pb b{font-family:'JetBrains Mono',monospace;font-size:.55rem;font-weight:700;color:var(--gold);margin-left:.05rem;}
.wc-pb-off{color:#ff6b6b;display:inline-flex;}
.wc-pb-on{color:#5fcf8e;display:inline-flex;}
.wc-detail-subs{font-size:.66rem;color:var(--chalk-dim);line-height:1.6;}
.wc-sub-on{color:var(--chalk);}
.wc-detail-live-tag{display:inline-flex;align-items:center;gap:.3rem;font-size:.58rem;font-weight:800;letter-spacing:.05em;color:#ff8a8a;}
.wc-detail-score-num-live{color:#ff6b6b;}

/* match preview */
.wc-preview-kick{font-family:'Anton',sans-serif;font-size:1.5rem;color:var(--gold);line-height:1;}
.wc-preview-section{padding:1rem 0;border-top:1px solid var(--pitch-line);}
.wc-preview-h{font-family:'Anton',sans-serif;text-transform:uppercase;font-size:.85rem;color:var(--chalk);margin-bottom:.7rem;}
.wc-preview-hl{box-shadow:inset 3px 0 0 var(--gold);background:rgba(215,163,61,.1);}
.wc-preview-meta{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.4rem;margin-bottom:.4rem;font-size:.72rem;color:var(--chalk-dim);}
.wc-preview-coach{color:var(--chalk);}
.wc-detail-subs-label{color:var(--gold);font-weight:700;text-transform:uppercase;letter-spacing:.05em;font-size:.58rem;margin-right:.25rem;}
.wc-detail-timeline{padding-top:1rem;border-top:1px solid var(--pitch-line);}
.wc-detail-tl-head{font-family:'Anton',sans-serif;text-transform:uppercase;font-size:.85rem;color:var(--chalk);margin-bottom:.7rem;}
.wc-detail-empty{color:var(--chalk-dim);font-size:.78rem;padding:.5rem 0;}
.wc-tl-row{display:grid;grid-template-columns:1fr 2.6rem 1fr;align-items:center;gap:.4rem;padding:.18rem 0;}
.wc-tl-left{display:flex;justify-content:flex-end;text-align:right;}
.wc-tl-right{display:flex;justify-content:flex-start;text-align:left;}
.wc-tl-min{font-family:'JetBrains Mono',monospace;font-size:.66rem;font-weight:700;color:var(--gold);text-align:center;}
.wc-tl-item{display:inline-flex;align-items:center;gap:.4rem;}
.wc-tl-right .wc-tl-item{flex-direction:row-reverse;}
.wc-tl-icon{display:inline-flex;align-items:center;color:var(--chalk-dim);}
.wc-tl-text{display:flex;flex-direction:column;}
.wc-tl-main{font-size:.76rem;font-weight:600;}
.wc-tl-detail{font-size:.6rem;color:var(--chalk-dim);}

/* footer */
.wc-footer{max-width:1200px;margin:2.5rem auto 0;border-top:1px solid var(--pitch-line);padding-top:1rem;}
.wc-legend{display:flex;gap:1rem;flex-wrap:wrap;font-size:.7rem;color:var(--chalk-dim);margin-bottom:.65rem;}
.wc-legend-item{display:inline-flex;align-items:center;gap:.3rem;}
.wc-legend-dot{width:.5rem;height:.5rem;border-radius:50%;display:inline-block;}
.wc-about{font-size:.76rem;color:var(--chalk-dim);}
.wc-about summary{cursor:pointer;display:flex;align-items:center;gap:.3rem;color:var(--chalk);font-weight:600;}
.wc-about p{margin:.45rem 0 0;line-height:1.55;max-width:600px;}

@media(max-width:600px){
  .wc-app{padding:1rem .75rem 2.5rem;}
  .wc-match-body{gap:.3rem;}
  .wc-match-flag{width:1.2rem;height:1.2rem;}
  .wc-match-name{font-size:.72rem;}
  .wc-step-btn{width:1.7rem;height:1.7rem;}
  .wc-stat-strip{gap:1rem;}

  /* nav: stack the two groups full-width; flow buttons form a tidy 2×2 grid */
  .wc-nav{gap:.5rem;}
  .wc-nav-flow{width:100%;}
  .wc-nav-flow .wc-nav-btn{flex:1 1 40%;justify-content:center;text-align:center;}
  .wc-nav-explore{width:100%;}
  .wc-nav-explore .wc-nav-btn{flex:1;justify-content:center;}

  /* teams controls: search on its own row, selects share the next */
  .wc-teams-search{flex:1 1 100%;}
  .wc-teams-select{flex:1 1 28%;min-width:0;}
  .wc-teams-count{margin-left:0;}

  /* match-detail modal: tighter header so team names don't crowd the score */
  .wc-modal{padding:1rem;}
  .wc-modal-close{top:.55rem;right:.55rem;}
  .wc-detail-score{padding:.2rem .4rem 1rem;gap:.4rem;align-items:flex-start;}
  /* Stack the flag centered under the team name so the circles stay inside the border */
  .wc-detail-team-btn{font-size:.8rem;gap:.35rem;flex-direction:column-reverse;align-items:center;text-align:center;min-width:0;}
  .wc-detail-team-right{flex-direction:column;text-align:center;justify-content:flex-start;}
  .wc-detail-flag{width:1.5rem;height:1.5rem;}
  .wc-detail-score-num{font-size:1.6rem;}

  /* timeline: less side gutter on small screens */
  .wc-tl-row{grid-template-columns:1fr 2.2rem 1fr;gap:.25rem;}
}

/* ── Pick a team — road to the final ── */
.wc-linklike{background:none;border:none;padding:0;color:inherit;font:inherit;cursor:pointer;}
.wc-linklike:hover{color:var(--gold);}
.wc-path{max-width:980px;margin:0 auto;}
.wc-section-title{font-size:1.15rem;font-weight:700;margin:0 0 .35rem;}
.wc-path-blurb{color:var(--chalk-dim);font-size:.85rem;line-height:1.5;margin:0 0 1rem;max-width:62ch;}
.wc-path-pickwrap{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:.55rem;margin-bottom:1.25rem;}
.wc-path-pickgroup{background:var(--pitch-card);border:1px solid var(--pitch-line);border-radius:11px;padding:.5rem .55rem;}
.wc-path-pickhead{font-size:.62rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--chalk-dim);margin-bottom:.4rem;}
.wc-path-pickrow{display:flex;flex-direction:column;gap:.28rem;}
.wc-path-pickbtn{display:flex;align-items:center;gap:.45rem;background:var(--pitch-deep);border:1px solid var(--pitch-line);border-radius:8px;padding:.3rem .5rem;color:var(--chalk-dim);font-size:.78rem;font-weight:600;text-align:left;}
.wc-path-pickbtn:hover{color:var(--chalk);border-color:var(--gold-soft);}
.wc-path-pickactive{background:var(--gold-soft);border-color:var(--gold);color:var(--chalk);}
.wc-path-empty{display:flex;align-items:center;gap:.5rem;justify-content:center;color:var(--chalk-dim);font-size:.85rem;padding:2rem 1rem;border:1px dashed var(--pitch-line);border-radius:12px;}
.wc-path-board{background:var(--pitch-card);border:1px solid var(--pitch-line);border-radius:14px;padding:1.1rem;}
.wc-path-status{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;}
.wc-path-status-team{display:flex;align-items:center;gap:.7rem;}
.wc-path-status-name{font-size:1.15rem;font-weight:700;}
.wc-path-status-line{color:var(--chalk-dim);font-size:.8rem;margin-top:.15rem;}
.wc-path-switch{flex-shrink:0;}
.wc-path-warn{display:flex;align-items:flex-start;gap:.45rem;background:var(--gold-soft);border:1px solid var(--gold);border-radius:10px;padding:.55rem .7rem;color:var(--chalk);font-size:.78rem;line-height:1.45;margin-top:.9rem;}
.wc-path-scenario{color:var(--chalk-dim);font-size:.88rem;margin:1rem 0 .8rem;display:flex;justify-content:space-between;align-items:center;gap:.75rem;flex-wrap:wrap;}
.wc-path-scenario strong{color:var(--chalk);}
.wc-path-reset{display:inline-flex;align-items:center;gap:.3rem;background:transparent;color:var(--chalk-dim);border:1px solid var(--pitch-line);border-radius:999px;padding:.25rem .6rem;font-size:.72rem;font-weight:600;cursor:pointer;flex-shrink:0;}
.wc-path-reset:hover{color:var(--gold);border-color:var(--gold);}
.wc-path-up{display:flex;width:fit-content;align-items:center;gap:.4rem;margin:.4rem auto 0;background:transparent;color:var(--chalk-dim);border:1px solid var(--pitch-line);border-radius:999px;padding:.4rem .9rem;font:inherit;font-size:.78rem;font-weight:600;cursor:pointer;}
.wc-path-up:hover{color:var(--gold);border-color:var(--gold);}
.wc-path-locked{display:inline-flex;align-items:center;font-size:.74rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--gold);background:rgba(215,163,61,.12);border:1px solid rgba(215,163,61,.4);border-radius:999px;padding:.3rem .7rem;flex-shrink:0;}
.wc-path-foot{display:flex;align-items:center;justify-content:space-between;gap:.6rem;flex-wrap:wrap;margin-top:.5rem;}
.wc-path-preview{display:inline-flex;align-items:center;gap:.3rem;background:none;border:1px solid var(--pitch-line);border-radius:999px;color:var(--chalk-dim);font:inherit;font-size:.72rem;font-weight:600;padding:.2rem .55rem;cursor:pointer;flex-shrink:0;}
.wc-path-preview:hover{color:var(--gold);border-color:var(--gold);}
.wc-path-whatif{color:var(--pitch-deep);background:var(--gold);border-color:var(--gold);}
.wc-path-pick{display:flex;align-items:center;gap:.45rem;margin-top:.5rem;flex-wrap:wrap;}
.wc-path-pick-k{font-size:.68rem;color:var(--chalk-dim);text-transform:uppercase;letter-spacing:.04em;font-weight:700;}
.wc-path-pick-sel{background:var(--pitch-card);color:var(--chalk);border:1px solid var(--pitch-line);border-radius:7px;padding:.2rem .4rem;font-size:.8rem;font-weight:600;font-family:inherit;cursor:pointer;}
.wc-path-pick-sel:hover{border-color:var(--gold);}
.wc-path-steps{position:relative;}
.wc-path-step{display:grid;grid-template-columns:1.7rem 1fr;gap:.7rem;}
.wc-path-rail{display:flex;flex-direction:column;align-items:center;}
.wc-path-rail::before{content:"";flex:0 0 .5rem;}
.wc-path-step:not(.wc-path-step-final) .wc-path-rail::after{content:"";flex:1;width:2px;background:var(--pitch-line);margin:.25rem 0;}
.wc-path-dot{width:1.4rem;height:1.4rem;border-radius:999px;background:var(--pitch-deep);border:2px solid var(--gold);display:flex;align-items:center;justify-content:center;color:var(--gold);flex-shrink:0;}
.wc-path-step-final .wc-path-dot{background:var(--gold);color:var(--pitch-deep);}
.wc-path-card{background:var(--pitch-deep);border:1px solid var(--pitch-line);border-radius:11px;padding:.6rem .8rem;margin-bottom:.7rem;}
.wc-path-step-final .wc-path-card{border-color:var(--gold);}
.wc-path-card-head{display:flex;align-items:center;gap:.5rem;margin-bottom:.4rem;}
.wc-path-round{font-size:.66rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--gold);}
.wc-path-proj{font-size:.6rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--chalk-dim);background:var(--pitch-card);border:1px solid var(--pitch-line);border-radius:999px;padding:.05rem .4rem;}
.wc-path-match{display:flex;align-items:center;gap:.55rem;flex-wrap:wrap;}
.wc-path-side{display:inline-flex;align-items:center;gap:.4rem;font-weight:600;font-size:.9rem;}
.wc-path-me{color:var(--chalk);}
.wc-path-opp{color:var(--chalk);}
.wc-path-opp.wc-linklike:hover{color:var(--gold);}
.wc-path-vs{color:var(--chalk-dim);font-size:.72rem;font-weight:700;text-transform:uppercase;}
.wc-path-seed{color:var(--chalk-dim);font-size:.68rem;font-weight:600;}
.wc-path-tbd{color:var(--chalk-dim);font-style:italic;font-weight:500;font-size:.82rem;}
.wc-path-meta{color:var(--chalk-dim);font-size:.72rem;margin-top:.4rem;}
@media (max-width:560px){
  .wc-path-status{flex-direction:column;align-items:flex-start;}
  .wc-path-switch{width:100%;}
  .wc-path-switch .wc-view-btn{flex:1;}
}
`;
