import styled, { css } from "styled-components";

export const Badge = styled.span<{ $status: string }>`
	flex-shrink: 0;
	padding: 0.25rem 0.6rem;
	border-radius: 999px;
	font-size: 0.8rem;
	font-weight: 600;
	background: #f3f4f6;
	color: #374151;

	${({ $status }) =>
		$status === "listo" &&
		css`
			background: #f0fdf4;
			color: #15803d;
		`}

	${({ $status }) =>
		$status === "error" &&
		css`
			background: #fef2f2;
			color: #b91c1c;
		`}

	${({ $status }) =>
		($status === "creando" || $status === "instalando") &&
		css`
			background: #eff6ff;
			color: #1d4ed8;
		`}
`;
