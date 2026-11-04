import { render, screen } from "@testing-library/react";
import { App } from "./App";

test("mostra o título RadioLog", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "RadioLog" })).toBeInTheDocument();
});
