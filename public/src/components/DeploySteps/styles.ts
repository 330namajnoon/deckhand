import styled, { css } from "styled-components";

export const Steps = styled.ol`
	list-style: none;
	padding: 0;
	margin: 2rem 0 0;
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
`;

export const Step = styled.li<{ $state: "done" | "active" | "pending" | "error" }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1rem;
	border-radius: 8px;
	border: 1px solid #e5e7eb;

	${({ $state }) =>
		$state === "done" &&
		css`
			border-color: #86efac;
			background: #f0fdf4;
		`}

	${({ $state }) =>
		$state === "active" &&
		css`
			border-color: #93b4f5;
			background: #eff6ff;
		`}

	${({ $state }) =>
		$state === "pending" &&
		css`
			color: #9ca3af;
		`}

	${({ $state }) =>
		$state === "error" &&
		css`
			border-color: #fca5a5;
			background: #fef2f2;
		`}
`;
