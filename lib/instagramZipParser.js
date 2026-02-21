import JSZip from "jszip";

const FOLLOWERS_PATH = "connections/followers_and_following/followers_1.json";
const FOLLOWING_PATH = "connections/followers_and_following/following.json";

const USERNAME_RE = /^[A-Za-z0-9._]{1,30}$/;

function usernameFromHref(href) {
  if (!href) return null;
  try {
    const url = new URL(href);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "_u" && parts[1]) return parts[1];
    return parts[0] || null;
  } catch {
    return null;
  }
}

function extractFollowersUsernames(followersJson) {
  const out = new Set();
  for (const item of followersJson || []) {
    const sld = item?.string_list_data || [];
    const entry = sld[0];
    const u = entry?.value || usernameFromHref(entry?.href);
    if (u && USERNAME_RE.test(u)) out.add(u);
  }
  return out;
}

function extractFollowingUsernames(followingJson) {
  const out = new Set();
  const items = followingJson?.relationships_following || [];
  for (const item of items) {
    const title = item?.title;
    if (typeof title === "string" && USERNAME_RE.test(title.trim())) {
      out.add(title.trim());
      continue;
    }
    const sld = item?.string_list_data || [];
    const entry = sld[0];
    const u = entry?.value || usernameFromHref(entry?.href);
    if (u && USERNAME_RE.test(u)) out.add(u);
  }
  return out;
}

export async function analyzeInstagramZip(file) {
  const zip = await JSZip.loadAsync(file);

  const followersFile = zip.file(FOLLOWERS_PATH);
  const followingFile = zip.file(FOLLOWING_PATH);

  if (!followersFile || !followingFile) {
    const available = Object.keys(zip.files);
    throw new Error(
      `Required files not found. Expected:\n- ${FOLLOWERS_PATH}\n- ${FOLLOWING_PATH}\n\nFound paths like:\n` +
        available.slice(0, 40).join("\n")
    );
  }

  const followersJson = JSON.parse(await followersFile.async("string"));
  const followingJson = JSON.parse(await followingFile.async("string"));

  const followers = extractFollowersUsernames(followersJson);
  const following = extractFollowingUsernames(followingJson);

  const notFollowingBack = [...following].filter((u) => !followers.has(u)).sort();
  const youDontFollowBack = [...followers].filter((u) => !following.has(u)).sort();
  const mutuals = [...followers].filter((u) => following.has(u)).sort();

  return {
    counts: {
      followers: followers.size,
      following: following.size,
      not_following_back: notFollowingBack.length,
      you_dont_follow_back: youDontFollowBack.length,
      mutuals: mutuals.length,
    },
    not_following_back: notFollowingBack,
    you_dont_follow_back: youDontFollowBack,
    mutuals,
  };
}
