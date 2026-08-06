import styled, { css } from "styled-components";

export type ButtonVariant = "primary" | "danger" | "warning";

const COLORS: Record<ButtonVariant, { background: string; disabled: string }> = {
	primary: { background: "#2563eb", disabled: "#93b4f5" },
	danger: { background: "#dc2626", disabled: "#f5a3a3" },
	warning: { background: "#f59e0b", disabled: "#fcd9a1" },
};

export const StyledButton = styled.button<{ $variant: ButtonVariant; $small: boolean }>`
	padding: 0.6rem 1rem;
	font-size: 1rem;
	font-weight: 600;
	border: none;
	border-radius: 6px;
	background: ${({ $variant }) => COLORS[$variant].background};
	color: white;
	cursor: pointer;

	&:disabled {
		background: ${({ $variant }) => COLORS[$variant].disabled};
		cursor: not-allowed;
	}

	${({ $small }) =>
		$small &&
		css`
			padding: 0.4rem 0.8rem;
			font-size: 0.85rem;
		`}
`;
