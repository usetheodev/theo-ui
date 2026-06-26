import { useState } from "react";
import { Table } from "@theokit/ui";



const invoices = [
  { id: "inv_1", date: "2026-05-22", desc: "Pro subscription", amount: 20.0, status: "Paid" },
  { id: "inv_2", date: "2026-04-22", desc: "Pro subscription", amount: 20.0, status: "Paid" },
  { id: "inv_3", date: "2026-03-22", desc: "Pro subscription", amount: 20.0, status: "Refunded" },
];

export const Default = () => (
  <div className="w-full max-w-2xl">
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Date</Table.HeaderCell>
          <Table.HeaderCell>Description</Table.HeaderCell>
          <Table.HeaderCell align="right">Amount</Table.HeaderCell>
          <Table.HeaderCell>Status</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {invoices.map((inv) => (
          <Table.Row key={inv.id}>
            <Table.Cell>{inv.date}</Table.Cell>
            <Table.Cell>{inv.desc}</Table.Cell>
            <Table.Cell align="right" numeric>
              ${inv.amount.toFixed(2)}
            </Table.Cell>
            <Table.Cell>{inv.status}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  </div>
);

export const Compact = () => (
  <div className="w-full max-w-2xl">
    <Table density="compact">
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Date</Table.HeaderCell>
          <Table.HeaderCell>Description</Table.HeaderCell>
          <Table.HeaderCell align="right">Amount</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {invoices.map((inv) => (
          <Table.Row key={inv.id}>
            <Table.Cell>{inv.date}</Table.Cell>
            <Table.Cell>{inv.desc}</Table.Cell>
            <Table.Cell align="right" numeric>
              ${inv.amount.toFixed(2)}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  </div>
);

export const Sortable = () => {
  const [sortKey, setSortKey] = useState<"date" | "amount">("date");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const toggle = (key: "date" | "amount") => {
    if (sortKey === key) {
      setDirection(direction === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setDirection("desc");
    }
  };
  return (
    <div className="w-full max-w-2xl">
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell
              onSort={() => toggle("date")}
              sortDirection={sortKey === "date" ? direction : "none"}
            >
              Date
            </Table.HeaderCell>
            <Table.HeaderCell>Description</Table.HeaderCell>
            <Table.HeaderCell
              align="right"
              onSort={() => toggle("amount")}
              sortDirection={sortKey === "amount" ? direction : "none"}
            >
              Amount
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {invoices.map((inv) => (
            <Table.Row key={inv.id}>
              <Table.Cell>{inv.date}</Table.Cell>
              <Table.Cell>{inv.desc}</Table.Cell>
              <Table.Cell align="right" numeric>
                ${inv.amount.toFixed(2)}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};

export const NumericAlignment = () => (
  <div className="w-full max-w-md">
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Metric</Table.HeaderCell>
          <Table.HeaderCell align="right">Value</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.Cell>Data Transfer</Table.Cell>
          <Table.Cell align="right" numeric>
            12.5 GB
          </Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Edge Requests</Table.Cell>
          <Table.Cell align="right" numeric>
            12,345
          </Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Build Minutes</Table.Cell>
          <Table.Cell align="right" numeric>
            240
          </Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  </div>
);
