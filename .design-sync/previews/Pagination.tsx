import { useState } from "react";
import { Pagination } from "@theokit/ui";



export const Default = () => {
  const [page, setPage] = useState(3);
  return <Pagination currentPage={page} totalPages={7} onPageChange={setPage} />;
};

export const ManyPages = () => {
  const [page, setPage] = useState(20);
  return <Pagination currentPage={page} totalPages={42} onPageChange={setPage} />;
};

export const NearStart = () => {
  const [page, setPage] = useState(2);
  return <Pagination currentPage={page} totalPages={42} onPageChange={setPage} />;
};

export const NearEnd = () => {
  const [page, setPage] = useState(41);
  return <Pagination currentPage={page} totalPages={42} onPageChange={setPage} />;
};

export const Compact = () => {
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

export const SinglePage = () => (
  <div>
    <p className="mb-2 text-body-sm text-muted-foreground">
      (Renders nothing when totalPages === 1.)
    </p>
    <Pagination currentPage={1} totalPages={1} onPageChange={() => undefined} />
  </div>
);
