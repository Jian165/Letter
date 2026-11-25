import { withBasePath } from "@/lib/asset-path";
import type { LetterState, MusicSettings, MusicTrackId } from "@/types";

export const SEALED_TRACK_ID: MusicTrackId = "dawn";

export const SEALED_LETTER: LetterState = {
  recipient: "KC",
  message:
    "Hi love, I hope you're having a good day po. This is a small dedication letter lang for you, gusto ko lang bumawi since I wasn’t able to send you anything during your birthday. I already plan doing this pero I got sick and ngayon lang ako nagka-time, my apologies. Belated happy birthday pa din lalove kahit 4 days late na. Well, best wishes for you my love, I hope 25 would be your good to you.\n\nI just want you to know you are very special to me, you are someone na nilo-look forward ko every time I experience challenges. I really appreciate you being in my life, thank you so much, you done a lot for me to be honest. You being here with me especially now really means a lot to me kasi napaka-challenging talaga kung nasaan talaga ako ngayon, but I keep it up because I know there’s you willing to be present kahit sa maikling oras lang, even on my lunch time lang kita nakakausap. I know you are always busy so that’s why I appreciate your presence. Though kahit enough na yun sakin, I always wish na makasama kita na di tayo magkalayo because I really wanna experience yung regular na ginagawa ng couple such as date, like I wanna be physically with you. But it's fine, those are one of the things lang na nilo-look forward ko as we go with our relationship. I’m still very, very happy sa relationship natin.\n\nI really wanna describe you as my sunrise. Like when I go to the office kasi, like hatinggabi and everything is just sad and dark vibe kasi stressful yung work. But one thing that keep me up is the view of the sunrise sa station ko and it’s so pretty. When I saw that sunrise it give me a little hope and smile because I survive the night and 6am na. I know when I go to my locker and pick up my phone, there's you. And same with the sunrise are present at exactly 6am looking so pretty giving me smile and hope.\n\nThank you so much my love, I love you.",
  sender: "Jhon Mark",
  photoUrl: withBasePath("/images/keepsake.jpg"),
  caption: "",
};

export const SEALED_MUSIC: MusicSettings = {
  trackId: SEALED_TRACK_ID,
  volume: 0.7,
  muted: false,
};
