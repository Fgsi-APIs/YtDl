import { exec } from "child_process";
import path from "path";

let handler = async (m, { conn, text, command, usedPrefix, args }) => {
  if (!text)
    return conn.sendAccessDanied(m.chat, `${command} <url/name>`, command, m);
  await BKNLD(m.chat);
  try {
    const videoData = await getYouTubeInfo(args[0]);
    if ((videoData?.duration || 0) > 3600)
      return conn.sendErrorAccess(
        m.chat,
        "Video yang diunggah harus berdurasi kurang dari 1 jam.",
        m,
      );

    return await downloadYouTubeVideo(args[0], "./tmp").then(
      async (FileName) => {
        const videoPath = `./tmp/${FileName}.mp3`;
        return await conn
          .sendMessage(
            m.chat,
            {
              audio: { url: videoPath }, //(await conn.getFile(videoPath)).data,
              fileName: "YouTube Downloader",
              mimetype: "audio/mp4",
              ppt: true,
              contextInfo: {
                externalAdReply: {
                  title: Styles(videoData?.title || "No Title"),
                  body: wm,
                  mediaType: 2,
                  showAdAttribution: true,
                  thumbnail: (await conn.getFile(videoData?.thumbnail)).data,
                  mediaUrl: text,
                  sourceUrl: text,
                },
              },
            },
            {
              quoted: m,
            },
          )
          .catch(async () => {
            return await conn.sendMessage(
              m.chat,
              {
                document: { url: videoPath }, //(await conn.getFile(videoPath)).data,
                mimetype: "audio/mp3",
                text: args[0] + "\n" + Styles(videoData?.title || "No Title"),
                fileName: `${videoData.title}.mp3`,
                contextInfo: {
                  externalAdReply: {
                    title: Styles(videoData?.title || "No Title"),
                    body: wm,
                    mediaType: 2,
                    showAdAttribution: true,
                    thumbnail: (await conn.getFile(videoData?.thumbnail)).data,
                    mediaUrl: text,
                    sourceUrl: text,
                  },
                },
              },
              { quoted: m },
            );
          });
      },
    );
  } catch (e) {
    console.error(e);
    if (e?.message?.includes("ERROR: Unsupported URL")) {
      return conn.sendErrorAccess(m.chat, "The video doesn't exist", m);
    }
    return conn.sendErrorAccess(m.chat, `Error: ${e.message}`, m);
  }
};

handler.help = ["ytmp3"].map((v) => v + " <url>");
handler.tags = ["downloader"];
handler.command = /^yt(mp3|audio)|youtube(mp3|audio)$/i;
handler.limit = true;
handler.cooldown = 25000;

export default handler;

function getYouTubeInfo(url) {
  return new Promise((resolve, reject) => {
    const filePath = path.resolve("./YtDl/yt-dlp");
    exec(
      `${filePath} --cookies YtDl/yt-cookies.txt -j ${url}`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          return reject(error);
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
        }
        resolve(JSON.parse(stdout));
      },
    );
  });
}

function downloadYouTubeVideo(url, outputPath) {
  return new Promise((resolve, reject) => {
    const filePath = path.resolve("./YtDl/yt-dlp");
    const fileName = `${Date.now()}-ytdl-by-fgsidev`;
    exec(
      `${filePath} --cookies YtDl/yt-cookies.txt -f bestvideo+bestaudio -x --audio-format mp3 -o "${outputPath}/${fileName}.%(ext)s" ${url}`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          return reject(error);
        }
        resolve(fileName);
      },
    );
  });
}
