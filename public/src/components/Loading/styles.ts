import styled, { keyframes } from "styled-components";

const spin = keyframes`
	to { transform: rotate(360deg); }
`;

export const Spinner = styled.span`
	display: inline-block;
	width: 1em;
	height: 1em;
	border: 2px solid #2563eb;
	border-top-color: transparent;
	border-radius: 50%;
	animation: ${spin} 0.8s linear infinite;
`;

export const Wrapper = styled.p`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-top: 1.5rem;
	color: #6b7280;
`;

export const InlineWrapper = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	margin-left: 0.5rem;
	color: #6b7280;
	font-size: 0.85em;
	font-weight: normal;
`;
