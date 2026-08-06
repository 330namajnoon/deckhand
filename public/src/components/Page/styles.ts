import styled from "styled-components";

export const Container = styled.div<{ $maxWidth: string }>`
	max-width: ${({ $maxWidth }) => $maxWidth};
	margin: 0 auto;
	padding: 2rem 1rem;
`;

export const Title = styled.h1`
	font-size: 2rem;
`;
