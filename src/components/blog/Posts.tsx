import { getPosts } from "@/utils/utils";
import { Grid } from "@once-ui-system/core";
import Post from "./Post";

interface PostsProps {
  range?: [number] | [number, number];
  columns?: "1" | "2" | "3";
  thumbnail?: boolean;
  direction?: "row" | "column";
  exclude?: string[];
  indexOffset?: number;
}

export function Posts({
  range,
  columns = "1",
  thumbnail = false,
  exclude = [],
  direction,
  indexOffset = 0,
}: PostsProps) {
  let allBlogs = getPosts(["src", "app", "blog", "posts"]);

  // Exclude by slug (exact match)
  if (exclude.length) {
    allBlogs = allBlogs.filter((post) => !exclude.includes(post.slug));
  }

  const sortedBlogs = allBlogs.sort((a, b) => {
    const diff = new Date(b.metadata.publishedAt).getTime() - new Date(a.metadata.publishedAt).getTime();
    if (diff !== 0) return diff;
    return b.slug.localeCompare(a.slug);
  });

  const displayedBlogs = range
    ? sortedBlogs.slice(range[0] - 1, range.length === 2 ? range[1] : sortedBlogs.length)
    : sortedBlogs;

  return (
    <>
      {displayedBlogs.length > 0 && (
        <Grid columns={columns} s={{ columns: 1 }} fillWidth marginBottom="40" gap="16">
          {displayedBlogs.map((post, i) => (
            <Post key={post.slug} post={post} thumbnail={thumbnail} direction={direction} index={indexOffset + i} />
          ))}
        </Grid>
      )}
    </>
  );
}
