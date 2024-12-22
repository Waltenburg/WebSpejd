import {CCMR_server} from '../server'

test('hello world!', () => {
	expect(1 + 1).toBe(2);
});
test('Time String', () => {
	expect(CCMR_server.getTimeString()).resolves
});