import { exec } from "child_process";
import path from "path";
import moment from "moment";

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
        const videoPath = `./tmp/${FileName}.mp4`;
        return await conn
          .sendMessage(
            m.chat,
            {
              video: { url: videoPath }, //(await conn.getFile(videoPath)).data,
              caption: `*${videoData?.title?.replace?.(/[\n]/, "")?.trim?.() || "YouTube Downloader"}*

*⌬ Ext* : Download
*⌬ ID* : ${videoData.id}
*⌬ Durasi* : ${formatDuration(videoData?.duration || 0)}
*⌬ Upload* : ${formatUploadDate(videoData?.upload_date)}
*⌬ Views* : ${videoData?.view_count?.toLocaleString() || 0}
*⌬ Quality* : ${videoData?.format?.sort?.((a, b) => b.height - a.height)?.[0]?.format_note || "N/A"}
*⌬ Channel* : ${videoData?.uploader || "-"}

_*Nihh Omm...*_`,
              fileName: "YouTube Downloader",
              mimetype: "video/mp4",
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
                mimetype: "video/mp4",
                text: args[0] + "\n" + Styles(videoData?.title || "No Title"),
                fileName: `${videoData.title}.mp4`,
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

handler.help = ["ytmp4"].map((v) => v + " <url>");
handler.tags = ["downloader"];
handler.command = /^yt|yt(mp4|video)|youtube|youtube(mp4|video)$/i;
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
    const fileName = `${Date.now()}-ytdl-by-fgsideb`;
    exec(
      `${filePath} --cookies YtDl/yt-cookies.txt -f bestvideo+bestaudio --merge-output-format mp4 -o "${outputPath}/${fileName}.%(ext)s" ${url}`,
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

function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs ? hrs + ":" : ""}${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatLongDate(uploadDate) {
  return moment(uploadDate, "YYYYMMDD").format("DD MMMM YYYY");
}

function formatRelativeTime(uploadDate) {
  return moment(uploadDate, "YYYYMMDD").fromNow();
}
function formatUploadDate(uploadDate) {
  const longDate = formatLongDate(uploadDate);
  const relative = formatRelativeTime(uploadDate);
  return `${longDate} (${relative})`;
}
