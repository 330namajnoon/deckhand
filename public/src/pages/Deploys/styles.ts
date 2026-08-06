import styled from "styled-components";

export const SearchInput = styled.input`
	width: 100%;
	margin-top: 1.5rem;
	padding: 0.6rem 0.9rem;
	font-size: 1rem;
	border: 1px solid #ccc;
	border-radius: 6px;
	box-sizing: border-box;
`;

export const List = styled.ul`
	list-style: none;
	padding: 0;
	margin: 1.5rem 0 0;
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
`;

export const Empty = styled.p`
	margin-top: 1.5rem;
	color: #6b7280;
`;
