import type { Story } from "@ladle/react";
import { useState } from "react";
import { Pagination } from "./pagination.js";

export default { title: "Primitives / Navigation / Pagination" };

export const Default: Story = () => {
  const [page, setPage] = useState(3);
  return <Pagination currentPage={page} totalPages={7} onPageChange={setPage} />;
};

export const ManyPages: Story = () => {
  const [page, setPage] = useState(20);
  return <Pagination currentPage={page} totalPages={42} onPageChange={setPage} />;
};

export const NearStart: Story = () => {
  const [page, setPage] = useState(2);
  return <Pagination currentPage={page} totalPages={42} onPageChange={setPage} />;
};

export const NearEnd: Story = () => {
  const [page, setPage] = useState(41);
  return <Pagination currentPage={page} totalPages={42} onPageChange={setPage} />;
};

export const Compact: Story = () => {
  const [page, setPage] = useState(5);
  return (
    <Pagination
      currentPage={page}
      totalPages={10}
      onPageChange={setPage}
      size="sm"
      showJumpButtons={false}
    />
  );
};

export const SinglePage: Story = () => (
  <div>
    <p className="mb-2 text-body-sm text-muted-foreground">
      (Renders nothing when totalPages === 1.)
    </p>
    <Pagination currentPage={1} totalPages={1} onPageChange={() => undefined} />
  </div>
);
