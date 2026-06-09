"use client";

import { useState } from "react";
import { Grid, Row, Button } from "@once-ui-system/core";
import Post from "./Post";

interface PaginatedPostsProps {
  posts: {
    slug: string;
    metadata: any;
    content: string;
  }[];
  columns?: "1" | "2" | "3";
  thumbnail?: boolean;
  direction?: "row" | "column";
  perPage?: number;
  indexOffset?: number;
}

export function PaginatedPosts({
  posts,
  columns = "1",
  thumbnail = false,
  direction,
  perPage = 10,
  indexOffset = 0,
}: PaginatedPostsProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(posts.length / perPage);
  const displayed = posts.slice(0, page * perPage);

  if (posts.length === 0) return null;

  return (
    <>
      <Grid columns={columns} s={{ columns: 1 }} fillWidth marginBottom="40" gap="16">
        {displayed.map((post, i) => (
          <Post key={post.slug} post={post} thumbnail={thumbnail} direction={direction} index={indexOffset + i} />
        ))}
      </Grid>
      {page < totalPages && (
        <Row fillWidth horizontal="center" marginBottom="40">
          <Button variant="secondary" size="m" onClick={() => setPage((p) => p + 1)}>
            Load more
          </Button>
        </Row>
      )}
    </>
  );
}
