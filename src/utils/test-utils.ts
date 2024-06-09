import { NextRequest, NextResponse } from "next/server";

export const mockRequest = (
	url: string,
	method: string = "GET",
	body?: any,
	headers?: Record<string, string>
): NextRequest => {
	const requestHeaders = new Headers(headers);
	requestHeaders.set("Content-Type", "application/json");

	const requestInit: RequestInit = { method, headers: requestHeaders };
	if (body) {
		requestInit.body = JSON.stringify(body);
	}

	return new NextRequest(new Request(url, requestInit));
};

export const mockResponse = (): NextResponse => {
	return new NextResponse();
};
