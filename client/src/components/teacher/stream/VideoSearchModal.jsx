import React, { useState, useCallback } from "react";
import { Modal, Input, Button } from "antd";
import { YoutubeFilled, SearchOutlined } from "@ant-design/icons";

const VideoSearchModal = ({ visible, onCancel, onSuccess }) => {
  const [videoPreview, setVideoPreview] = useState(null);

  const handleVideoSearch = useCallback(async (searchValue) => {
    if (!searchValue.trim()) {
      setVideoPreview(null);
      return;
    }

    // Extract YouTube video ID from various URL formats
    const getYouTubeId = (url) => {
      const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return match && match[2].length === 11 ? match[2] : null;
    };

    const videoId = getYouTubeId(searchValue.trim());
    if (videoId) {
      try {
        // YouTube Data API key - đọc từ environment variable
        const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

        if (API_KEY && API_KEY.trim()) {
          try {
            // Fetch video info and channel info in parallel for better performance
            const [videoResponse] = await Promise.all([
              fetch(
                `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${API_KEY}&part=snippet,statistics,contentDetails`
              ),
            ]);
            if (videoResponse.ok) {
              const videoData = await videoResponse.json();
              if (videoData.items && videoData.items.length > 0) {
                const video = videoData.items[0];
                const snippet = video.snippet;
                const statistics = video.statistics;
                const contentDetails = video.contentDetails;

                // Parse duration từ ISO 8601 format (PT4M13S -> 4:23)
                const parseDuration = (duration) => {
                  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
                  const hours = (match[1] || "").replace("H", "");
                  const minutes = (match[2] || "").replace("M", "");
                  const seconds = (match[3] || "").replace("S", "");

                  if (hours) {
                    return `${hours}:${minutes.padStart(
                      2,
                      "0"
                    )}:${seconds.padStart(2, "0")}`;
                  } else {
                    return `${minutes || "0"}:${seconds.padStart(2, "0")}`;
                  }
                };

                // Fetch channel thumbnail
                let channelThumbnail = null;
                try {
                  const channelResp = await fetch(
                    `https://www.googleapis.com/youtube/v3/channels?id=${snippet.channelId}&key=${API_KEY}&part=snippet`
                  );
                  if (channelResp.ok) {
                    const channelData = await channelResp.json();
                    if (channelData.items && channelData.items.length > 0) {
                      const channelSnippet = channelData.items[0].snippet;
                      channelThumbnail =
                        channelSnippet.thumbnails?.default?.url ||
                        channelSnippet.thumbnails?.medium?.url ||
                        channelSnippet.thumbnails?.high?.url ||
                        null;
                    }
                  } else {
                    console.warn(
                      "Channel API response not ok:",
                      channelResp.status
                    );
                  }
                } catch (error) {
                  console.warn("Could not fetch channel thumbnail:", error);
                }

                const videoInfo = {
                  id: videoId,
                  title: snippet.title,
                  channel: snippet.channelTitle,
                  channelId: snippet.channelId,
                  channelThumbnail: channelThumbnail,
                  channelUrl: `https://www.youtube.com/channel/${snippet.channelId}`,
                  description: snippet.description,
                  duration: parseDuration(contentDetails.duration),
                  thumbnail:
                    snippet.thumbnails.maxres?.url ||
                    snippet.thumbnails.high?.url ||
                    snippet.thumbnails.medium?.url,
                  url: searchValue.trim(),
                  provider: "YouTube",
                  viewCount: parseInt(statistics.viewCount).toLocaleString(),
                  likeCount: statistics.likeCount
                    ? parseInt(statistics.likeCount).toLocaleString()
                    : "N/A",
                  publishedAt: new Date(
                    snippet.publishedAt
                  ).toLocaleDateString(),
                  tags: snippet.tags || [],
                };
                setVideoPreview(videoInfo);
                return;
              }
            }
          } catch (error) {
            console.error("Error with YouTube Data API:", error);
          }
        }

        // Fallback to oEmbed API nếu không có API key hoặc API fails
        const response = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );
        
        if (response.ok) {
          const data = await response.json();
          const videoInfo = {
            id: videoId,
            title: data.title,
            channel: data.author_name,
            channelId: null,
            channelThumbnail: null, // oEmbed doesn't provide channel thumbnail
            channelUrl: data.author_url,
            description: "Description not available",
            duration: "Unknown duration",
            thumbnail: data.thumbnail_url,
            url: searchValue.trim(),
            provider: data.provider_name,
            viewCount: "Unknown",
            likeCount: "N/A",
            publishedAt: "Unknown",
            tags: [],
          };
          setVideoPreview(videoInfo);
        } else {
          // Fallback to basic info
          const videoInfo = {
            id: videoId,
            title: "YouTube Video",
            channel: "Unknown Channel",
            channelId: null,
            channelThumbnail: null,
            channelUrl: null,
            description: "Description not available",
            duration: "Unknown duration",
            thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            url: searchValue.trim(),
            provider: "YouTube",
            viewCount: "Unknown",
            likeCount: "N/A",
            publishedAt: "Unknown",
            tags: [],
          };
          setVideoPreview(videoInfo);
        }
      } catch (error) {
        console.error("Error fetching video info:", error);
        // Fallback to basic info
        const videoInfo = {
          id: videoId,
          title: "YouTube Video",
          channel: "Unknown Channel",
          duration: "Unknown duration",
          thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          url: searchValue.trim(),
          provider: "YouTube",
        };
        setVideoPreview(videoInfo);
      }
    } else {
      setVideoPreview(null);
    }
  }, []);

  const handleVideoSubmit = useCallback(() => {
    if (videoPreview) {
      const videoAttachment = {
        id: Date.now().toString(),
        name: videoPreview.title,
        type: "video/youtube",
        url: videoPreview.url,
        title: videoPreview.title,
        // YouTube specific fields - save all for database
        videoId: videoPreview.id,
        embedUrl: `https://www.youtube.com/embed/${videoPreview.id}`, // Add embedUrl for iframe display
        thumbnail: videoPreview.thumbnail,
        duration: videoPreview.duration,
        channel: videoPreview.channel,
        channelThumbnail: videoPreview.channelThumbnail,
        viewCount: videoPreview.viewCount,
        description: videoPreview.description,
        // Additional metadata
        metadata: {
          publishedAt: videoPreview.publishedAt,
          likeCount: videoPreview.likeCount,
          tags: videoPreview.tags,
          embedUrl: `https://www.youtube.com/embed/${videoPreview.id}`, // Also save in metadata for consistency
        },
      };

      if (onSuccess) {
        onSuccess(videoAttachment);
      }

      // Reset and close
      setVideoPreview(null);
      if (onCancel) onCancel();
    }
      }, [videoPreview, onSuccess, onCancel]);

  const handleCancel = useCallback(() => {
    setVideoPreview(null);
    if (onCancel) onCancel();
  }, [onCancel]);

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
            <YoutubeFilled className="text-white text-base" />
          </div>
          <span className="text-lg">Add Video</span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={
        <div className="p-2 bg-white border-t flex justify-between items-center sticky bottom-0">
          <Button
            onClick={handleCancel}
            className="text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleVideoSubmit}
            className="bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700 font-medium px-6"
            size="large"
          >
            Add video
          </Button>
        </div>
      }
      width="80vw"
      className="youtube-modal"
      centered
      style={{ maxWidth: "1200px" }}
      styles={{
        body: { padding: 0 },
        header: {
          borderBottom: "1px solid #e5e7eb",
          paddingBottom: "16px",
          background: "white",
        },
        content: {
          borderRadius: "12px",
          overflow: "hidden",
        },
      }}
      maskClosable={false}
    >
      <div style={{ height: "75vh", maxHeight: "600px", overflow: "hidden" }}>
        {!videoPreview ? (
          /* Search State */
          <div className="p-8 text-center h-full overflow-y-auto">
            {/* YouTube Logo and Illustration */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                {/* Cat illustration */}
                <div className="w-32 h-32 bg-yellow-400 rounded-full flex items-center justify-center text-6xl mb-4 mx-auto">
                  🐱
                </div>
                {/* Computer illustration */}
                <div className="w-24 h-16 bg-gray-200 rounded border-2 border-gray-300 mx-auto relative">
                  <div className="w-16 h-10 bg-blue-200 rounded m-1">
                    <div className="w-6 h-6 bg-blue-400 rounded m-2 flex items-center justify-center">
                      ▶
                    </div>
                  </div>
                  <div className="absolute -right-2 top-0 w-6 h-4 bg-gray-300 rounded-t"></div>
                </div>
                {/* Plant illustration */}
                <div className="absolute left-0 bottom-0 w-8 h-12 bg-green-400 rounded-t flex flex-col items-center">
                  <div className="w-2 h-8 bg-green-600 mt-1"></div>
                  <div className="w-6 h-4 bg-gray-400 rounded"></div>
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="max-w-md mx-auto">
              <Input
                placeholder="Search YouTube or paste URL"
                size="large"
                className="border-2 border-blue-400 focus:border-blue-500"
                style={{
                  borderRadius: "24px",
                  padding: "12px 20px",
                  fontSize: "16px",
                }}
                onChange={(e) => handleVideoSearch(e.target.value)}
                autoFocus
                suffix={<div className="w-6 h-6 text-gray-400">🔍</div>}
              />
            </div>
          </div>
        ) : (
          /* Video Player State */
          <div className="h-full">
            {/* Back Button */}
            <div className="p-4 border-b">
              <Button
                type="text"
                icon={<span>←</span>}
                onClick={() => setVideoPreview(null)}
                className="text-gray-600 hover:text-gray-800"
              >
                Back
              </Button>
            </div>

            {/* Video Content */}
            <div
              className="flex flex-col md:flex-row"
              style={{
                height: "calc(70vh - 200px)",
                minHeight: "500px",
                maxHeight: "600px",
                overflow: "hidden",
              }}
            >
              {/* Video Player */}
              <div className="flex-1 bg-black relative">
                <iframe
                  src={`https://www.youtube.com/embed/${videoPreview.id}?rel=0&showinfo=0`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>

              {/* Video Info Sidebar - Google Classroom Style */}
              <div className="w-full md:w-96 md:min-w-80 bg-white border-l md:border-l border-t md:border-t-0 overflow-y-auto">
                {/* Header */}
                <div className="p-4 border-b">
                  <h3 className="text-xl font-normal text-gray-900 leading-tight mb-3">
                    {videoPreview.title}
                  </h3>

                  {/* Channel Info */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative w-8 h-8">
                      {videoPreview.channelThumbnail ? (
                        <>
                          <img
                            src={videoPreview.channelThumbnail}
                            alt={`${videoPreview.channel} avatar`}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              // Fallback to letter avatar if image fails
                              e.target.style.display = "none";
                              e.target.nextElementSibling.style.display =
                                "flex";
                            }}
                          />
                          <div className="w-8 h-8 rounded-full bg-red-600 items-center justify-center absolute top-0 left-0 hidden">
                            <span className="text-white text-sm font-bold">
                              {videoPreview.channel?.charAt(0)?.toUpperCase() ||
                                "Y"}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {videoPreview.channel?.charAt(0)?.toUpperCase() ||
                              "Y"}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {videoPreview.channel}
                    </span>
                  </div>

                  {/* Video Stats */}
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-1">
                      <span>YouTube video</span>
                      <span>•</span>
                      <span className="font-medium">
                        {videoPreview.duration}
                      </span>
                    </div>
                    {videoPreview.viewCount && (
                      <div className="font-medium text-gray-700">
                        {videoPreview.viewCount} views
                      </div>
                    )}
                    {videoPreview.likeCount &&
                      videoPreview.likeCount !== "N/A" && (
                        <div>{videoPreview.likeCount} likes</div>
                      )}
                    {videoPreview.publishedAt && (
                      <div>Published: {videoPreview.publishedAt}</div>
                    )}
                  </div>
                </div>

                {/* Full Video Information Section - Like Google Classroom */}
                <div className="p-4 border-b">
                  {/* Video Description - Full Format */}
                  {videoPreview.description && (
                    <div className="text-sm text-gray-700 leading-relaxed">
                      {videoPreview.description
                        .split("\n")
                        .map((line, index) => {
                          if (!line.trim()) {
                            return <div key={index} className="h-2"></div>;
                          }

                          // Parse hashtags
                          if (line.startsWith("#") || line.includes("#")) {
                            return (
                              <div
                                key={index}
                                className="mb-2 text-blue-600 font-medium"
                              >
                                {line.split(/(\#\w+)/g).map((part, partIndex) =>
                                  part.startsWith("#") ? (
                                    <span
                                      key={partIndex}
                                      className="text-blue-600 hover:text-blue-800 cursor-pointer mr-1"
                                    >
                                      {part}
                                    </span>
                                  ) : (
                                    part
                                  )
                                )}
                              </div>
                            );
                          }

                          // Parse URLs
                          const urlRegex = /(https?:\/\/[^\s]+)/g;
                          if (urlRegex.test(line)) {
                            const parts = line.split(urlRegex);
                            return (
                              <div key={index} className="mb-2">
                                {parts.map((part, partIndex) => {
                                  if (urlRegex.test(part)) {
                                    return (
                                      <a
                                        key={partIndex}
                                        href={part}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline break-all"
                                      >
                                        {part}
                                      </a>
                                    );
                                  }
                                  return <span key={partIndex}>{part}</span>;
                                })}
                              </div>
                            );
                          }

                          // Parse credits/roles (anything with colon)
                          if (
                            line.includes(":") &&
                            /^[A-Za-z\s&,()]+:/.test(line)
                          ) {
                            const [role, ...nameParts] = line.split(":");
                            const name = nameParts.join(":").trim();
                            return (
                              <div key={index} className="mb-1">
                                <span className="font-medium text-gray-800">
                                  {role.trim()}:
                                </span>
                                <span className="text-gray-700 ml-1">
                                  {name}
                                </span>
                              </div>
                            );
                          }

                          // Parse special symbols/bullets
                          if (
                            line.startsWith("♪") ||
                            line.startsWith("►") ||
                            line.startsWith("🔔")
                          ) {
                            return (
                              <div
                                key={index}
                                className="mb-2 font-medium text-gray-800"
                              >
                                {line
                                  .split(/(https?:\/\/[^\s]+)/g)
                                  .map((part, partIndex) => {
                                    if (/https?:\/\/[^\s]+/.test(part)) {
                                      return (
                                        <a
                                          key={partIndex}
                                          href={part}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline break-all"
                                        >
                                          {part}
                                        </a>
                                      );
                                    }
                                    return <span key={partIndex}>{part}</span>;
                                  })}
                              </div>
                            );
                          }

                          // Parse section headers (ALL CAPS or special formatting)
                          if (/^[A-Z\s:]+$/.test(line) && line.length < 50) {
                            return (
                              <div
                                key={index}
                                className="mb-2 mt-3 font-semibold text-gray-900 text-base"
                              >
                                {line}
                              </div>
                            );
                          }

                          // Parse lyrics or long text blocks (Vietnamese lyrics detection)
                          if (
                            line.length > 80 ||
                            /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/.test(
                              line
                            )
                          ) {
                            return (
                              <div
                                key={index}
                                className="mb-2 text-gray-600 italic leading-relaxed pl-2 border-l-2 border-gray-200"
                              >
                                {line}
                              </div>
                            );
                          }

                          // Default text
                          return (
                            <div key={index} className="mb-1 text-gray-700">
                              {line}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default VideoSearchModal;
